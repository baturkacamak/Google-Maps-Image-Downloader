// ==UserScript==
// @name         Google Maps Image Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This will add a download button to Google Maps images
// @author       Batur Kacamak
// @match        https://google.com/maps/**
// @match        https://www.google.com/maps/**
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/voca/1.4.0/voca.min.js
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_addStyle
// ==/UserScript==

class GoogleMapsImageDownloader {
  constructor() {
    this.elementCount = 0;
    this.imageSelector = '[role=img] > a.gallery-cell';
    this.anchor = null;
    this.timeout = null;
    this.addDownloadButton();
  }

  addDownloadButton() {
    const downloadIconUrl = 'https://www.gstatic.com/images/icons/material/system_gm/2x/arrow_back_gm_grey_24dp.png';
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '24px';
    div.style.bottom = '42px';
    div.style.transform = 'rotate(-90deg)';
    div.style.pointerEvents = 'auto';
    div.style.background = 'rgba(255, 240, 240, 0.27)';

    const image = document.createElement('img');
    image.style.display = 'block';
    image.setAttribute('src', downloadIconUrl);


    this.anchor = document.createElement('div');
    this.anchor.style.cursor = 'pointer';
    this.anchor.addEventListener('click', this.downloadFile.bind(this), false);

    this.anchor.append(image);
    div.append(this.anchor);

    if (document.querySelector('#viewer-footer')) {
      document.querySelector('#viewer-footer').append(div);
    } else {
      div.style.left = null;
      div.style.right = '55px';
      div.style.bottom = '35px';

      document.querySelector('.app-bottom-content-anchor').append(div);
    }

  }

  downloadFile() {
    axios({
      url: this.imageUrl,
      method: 'GET',
      responseType: 'blob', // important
    }).then((response) => {

      let fileName = 'file';
      if (document.querySelector('div.gm2-headline-6[jsan]')) {
        fileName = document.querySelector('div.gm2-headline-6[jsan]').innerText;
      } else if (document.querySelector('h1.widget-titlecard-header > span')) {
        fileName = document.querySelector('h1.widget-titlecard-header > span').innerText;
      }

      fileName = v.slugify(fileName);

      const fileDate = moment().format('YYYY-MM-D-HH-mm-ss');


      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}-${fileDate}.jpeg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  async elementsEventListener(selector, callback, event = 'click') {
    while ( !document.querySelector(selector) ) {
      await new Promise(r => setTimeout(r, 500));
    }
    const elements = document.querySelectorAll(selector);

    this.elementCount = elements.length;

    elements.forEach(item => {
      item.addEventListener(event, callback);
    });
  }

  checkElementCount() {
    const elementCount = document.querySelectorAll(this.imageSelector).length;
    return this.elementCount === elementCount
  }

  async bindNewImages() {
    clearInterval(this.timeout);
    this.timeout = setTimeout(async () => {
      if (!this.checkElementCount()) {
        await this.elementsEventListener(this.imageSelector, this.getImageUrl.bind(this));
      }
    }, 1000);
  }

  async events() {
    await this.elementsEventListener(this.imageSelector, this.getImageUrl.bind(this));
    await document.querySelector('div.section-layout.section-scrollbox').addEventListener('scroll', this.bindNewImages.bind(this))
  }

  getImageUrl() {
    setTimeout(() => {
      const backgroundImage = document.querySelector('.gallery-cell.selected .gallery-image-high-res').style.backgroundImage;
      const regex = /\("(.*)"\)/;
      const result = backgroundImage.match(regex);
      if (result) {
        const imageUrlHQ = result[1].replace(/(?<==.)\d*/, '1920');
        this.imageUrl = imageUrlHQ;
      }
    }, 300);

  }

}

window.onload = async () => {
  const googleMapsImageDownloader = new GoogleMapsImageDownloader();
  await googleMapsImageDownloader.events();
};
