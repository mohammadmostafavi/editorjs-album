/**
 * Build styles
 */
import css from './index.css';
import Uploader from './uploader';

/**
 * SimpleImage Tool for the Editor.js
 * Works only with pasted image URLs and requires no server-side uploader.
 *
 * @typedef {object} SimpleImageData
 * @description Tool's input and output data format
 * @property {string} url — image URL
 * @property {string} caption — image caption
 * @property {boolean} withBorder - should image be rendered with border
 * @property {boolean} withBackground - should image be rendered with background
 * @property {boolean} stretched - should image be stretched to full width of container
 */
export default class Slider {
  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: SimpleImageData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api}) {
    /**
     * Editor.js API
     */
    this.api = api;

    /**
     * Styles
     */
    this.CSS = {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,

      /**
       * Tool's classes
       */
      wrapper: 'cdx-slider',
      imageHolder: 'cdx-slider__picture',
      sliderHolder: 'cdx-slider__holder',
    };

    /**
     * Nodes cache
     */
    this.nodes = {
      wrapper: null,
      sliderHolder: null,
      imageHolder: null,
      image: null,
    };

    /**
     * Tool's initial data
     */
    this.data = {
      // url: data.url || '',
      images: data.images || [],
    };
    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config.endpoints || '',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || 'image',
      types: config.types || 'image/*',
      buttonContent: config.buttonContent || ''
    };
    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error)
    });

    /*
    SVG
     */
    this.SVG={
      plus:`<svg class="icon icon--plus"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#plus"></use></svg>`,
      close:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" class="icon icon--close"><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" class=""></path></svg>`
    }
  }

  static get toolbox() {
    return {
      title: 'Slider',
      icon: `<svg viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg" width="17" height="15"><path d="M291 150.242V79c0-18.778-15.222-34-34-34H79c-18.778 0-34 15.222-34 34v42.264l67.179-44.192 80.398 71.614 56.686-29.14L291 150.242zm-.345 51.622l-42.3-30.246-56.3 29.884-80.773-66.925L45 174.187V197c0 18.778 15.222 34 34 34h178c17.126 0 31.295-12.663 33.655-29.136zM79 0h178c43.63 0 79 35.37 79 79v118c0 43.63-35.37 79-79 79H79c-43.63 0-79-35.37-79-79V79C0 35.37 35.37 0 79 0z"></path></svg>`
    };
  }


  /**
   * Creates a Block:
   *  1) Show preloader
   *  2) Start to load an image
   *  3) After loading, append image and caption input
   * @public
   */
  render() {
    let wrapper = this._make('div', [this.CSS.baseClass, this.CSS.wrapper,'flexContainer']),
      sliderHolder = this._make('div', [this.CSS.sliderHolder]),
      toolsHolder = this._make('div'),
      plus = this._make('div', ['slide-plus-holder']);

    plus.innerHTML = this.SVG.plus;
    plus.addEventListener('click', () => {
      this._onSelectFile();
    });


    this.data.images.forEach((img,index)=>{
      let newImage = this._make('img',[],{src:img.url,'data-index':index});
      let imageHolder = this._make('div', this.CSS.imageHolder);
      let deleteButton = this._make('div',['delete-button']);
      deleteButton.innerHTML=this.SVG.close;
      deleteButton.addEventListener('click', () => {
        this._removeImage(deleteButton);
      });
      imageHolder.appendChild(newImage);
      imageHolder.appendChild(deleteButton);
      sliderHolder.appendChild(imageHolder);
    });
    wrapper.classList.remove(this.CSS.loading);

    // wrapper.appendChild(imageHolder);
    toolsHolder.appendChild(sliderHolder);
    wrapper.appendChild(toolsHolder);
    wrapper.appendChild(plus);

    // this.nodes.imageHolder = imageHolder;
    this.nodes.sliderHolder = sliderHolder;
    this.nodes.wrapper = wrapper;

    return wrapper;
  }

  /**
   * @public
   * Saving method
   * @param {Element} blockContent - Tool's wrapper
   * @return {SimpleImageData}
   */
  save(blockContent) {
    // console.log();
    return this.data;
    // let images = blockContent.querySelectorAll('img');
    //
    //
    // if (!images) {
    //   return this.data;
    // }
    //
    // return Object.assign(this.data, {
    //   images: images.src,
    // });
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      images: {},
      withBorder: {},
      withBackground: {},
      stretched: {},
      caption: {
        a: {
          href: true,
          target: '_blank',
          rel: 'nofollow'
        },
        b: {},
        i: {},
        br: true,
        span: {
          class: 'inline-code'
        },
        mark: {
          class: 'cdx-marker'
        }
      },
    };
  }

  /**
   * Read pasted image and convert it to base64
   *
   * @static
   * @param {File} file
   * @returns {Promise<SimpleImageData>}
   */
  onDropHandler(file) {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return new Promise(resolve => {
      reader.onload = (event) => {
        resolve({
          images: event.target.result,
        });
      };
    });
  }

  /**
   * Returns image data
   * @return {SimpleImageData}
   */
  get data() {
    return this._data;
  }

  /**
   * Set image data and update the view
   *
   * @param {SimpleImageData} data
   */
  set data(data) {
    this._data = Object.assign({}, this.data, data);
    if (this.nodes.image) {
      this.nodes.image.src = this.data.images[0];
    }
  }

  /**
   * Specify paste substitutes
   * @see {@link ../../../docs/tools.md#paste-handling}
   * @public
   */
  static get pasteConfig() {
    return {
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png)$/i
      },
      tags: ['img'],
      files: {
        mimeTypes: ['image/*']
      },
    };
  }


  /**
   * Helper for making Elements with attributes
   *
   * @param  {string} tagName           - new Element tag name
   * @param  {array|string} classNames  - list or name of CSS classname(s)
   * @param  {Object} attributes        - any attributes
   * @return {Element}
   */
  _make(tagName, classNames = null, attributes = {}) {
    let el = document.createElement(tagName);
    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (let attrName in attributes) {
      // el[attrName] = attributes[attrName];
      el.setAttribute(attrName, attributes[attrName]);
    }

    return el;
  }


  _onSelectFile() {
    this.uploader.uploadSelectedFile({
      onPreview: (src) => {
        // this.ui.showPreloader(src);
      }
    });
  }
  onUpload(response){
    let newImage = this._make('img',[],{src:response.body.file.thumb});
    let imageHolder = this._make('div', this.CSS.imageHolder);
    let deleteButton = this._make('div',['delete-button']);
    deleteButton.innerHTML=this.SVG.close;
    deleteButton.addEventListener('click', () => {
      this._removeImage(deleteButton);
    });
    imageHolder.appendChild(newImage);
    imageHolder.appendChild(deleteButton);
    this.nodes.sliderHolder.appendChild(imageHolder);
    this.data.images.push(response.body.file);
  }

  uploadingFailed(error){
    alert(error);
  }


  _removeImage(item){
    let index =this.getChildNumber(item);
    this.data.images.splice(index, 1);
    item.parentNode.remove();
  }

  getChildNumber(node) {
    return Array.prototype.indexOf.call(node.parentNode.parentNode.childNodes, node.parentNode);
  }
}
