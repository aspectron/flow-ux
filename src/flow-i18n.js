import {BaseElement, html, css, /*directive,*/ LitElement/*, parts as _parts*/} from './base-element.js';
import {directive, AsyncDirective} from './base-element.js';
export const i18nDirMap = new Map();
export const i18nElementsMap = new Map();

class i18n extends BaseElement{

	static hash(text) {
        var A = 5381,
            B = 9835,
            i    = text.length;
        while(i) {
            var ch = text.charCodeAt(--i);
            A = (A * 33) ^ ch;
            B = (B * 55) ^ ch ^ A;
        }
        A = A >= 0 ? A : (A & 0x7FFFFFFF) + 0x80000000;
        B = B >= 0 ? B : (B & 0x7FFFFFFF) + 0x80000000;
        return A.toString(16)+B.toString(16);
    }

    static entriesChanged(){
    	let entriesAll = this.getAllEntries();
    	let entries = this.getEntries();
    	let detail = {entries, entriesAll}
    	let ce = new CustomEvent("flow-i18n-entries-changed", {detail})
    	window.dispatchEvent(ce);
    }

	static stripWhitespace(text) {
		return text.replace(/\s\s+/g,' ').trim();
	}

    static createEntry(text, values=false){
		let hash = this.hash(text);
		//console.log("i18n.entries", this.entries, text)
		if(!this.entries[hash]){
			this.entries[hash] = Object.assign({en:text}, values || {});
			this.entriesChanged();
		}else if(values){
			Object.assign(this.entries[hash], values);
			this.entriesChanged();
		}
		return hash;
	}

	static t(text, defaults, locale){
		text = this.stripWhitespace(text);
		let hash = this.createEntry(text);
		if(this.testing)
			return `[${locale||this.locale}:${text}]`;
		let entry = this.entries[hash];
		let value = entry[locale||this.locale];
		//console.log("value", value, this.locale, text)
		//if(value !== undefined)
		//	return value;
		return value || defaults || text;
	}

	static setConfig(_config){
		config = _config;
	}
	static getConfig(){
		return config;
	}
	static setActiveLanguages(locales){
		let newLocale = false;
		config.languages.forEach(l=>{
			l.active = locales.includes(l.locale);
			if(l.locale == this.locale && !l.active)
				newLocale = 'en';
		});

		if(newLocale)
			this.setLocale(newLocale);
	}
	static getActiveLanguages(){
		return config.languages.filter(l=>l.active)
	}
	static getActiveLocales(){
		return this.getActiveLanguages().map(l=>l.locale);
	}
	static setEntries(list){
		(list ||[]).forEach(entry=>{
			this.entries[this.hash(entry.en)] = entry;
		});

		onLocaleChange();
	}
	static setTesting(testing){
		this.testing = testing;
		onLocaleChange();
	}
	static getEntries(){
		let activeLocales = this.getActiveLocales();
    	let entry;
    	return this.getAllEntries().map(e=>{
    		entry = {en:e.en};
    		activeLocales.forEach(l=>{
    			entry[l] = e[l] || "";
    		})
    		return entry;
    	})
	}
	static getAllEntries(){
		return Object.values(this.entries);
	}
	static get properties() {
		return {
			text:{type:String}
			//xx:{type:String}
		}
	}

	static setLocale(locale='en'){
		this.locale = locale;
		this.setLocalSetting('i18n-locale', locale);
		onLocaleChange();
	}

	static cleanText(text){
		return text
		.replace(/<\!\-\-\?lit([^>]*)\$-\->/g, "")
		.replace(/<\!\-\-\-\->/g, "")
	}

	constructor(){
		super();
		this.text = "";
		//this.setAttribute("c1", `${this.text}`)
		//console.log("constructor:", this.innerHTML, this.text)
	}

	createRenderRoot() {
		//this.innerHTML_ = this.innerHTML;
		return this;
	}

	connectedCallback(){
		super.connectedCallback();
		this._cb = this._cb || this.onLocaleChange.bind(this);
		window.addEventListener("flow-i18n-locale", this._cb)
		//this.setAttribute("c2", `${this.text}`)
		this.update();
	}

	disconnectedCallback(){
		super.disconnectedCallback();
		this._cb && window.removeEventListener("flow-i18n-locale", this._cb)
		//TODO MAYBE:: _parts.delete(this.renderRoot)
	}

	onLocaleChange(){
		this.update();
	}

	/*
	updated(changed){
		super.updated();
		console.log("changed", changed)
		this.setAttribute("c3", `${this.text}:${JSON.stringify(changed)}`)
	}
	*/

	render() {
		if(this.innerHTML_ == undefined){
			this.innerHTML_ = i18n.cleanText(this.innerHTML)
			this.innerHTML = "";
		}
		//if(this.getAttribute("xx") == 1)
		//this.log("innerHTML", i18n.locale, "inner:"+this.innerHTML_, " text:"+this.text)
		let strings = [i18n.t(this.text || this.innerHTML_)];
		strings.raw = [];
		return html(strings);
	}  
}


let config = {
	// languages:[
	// 	{title:'English', locale:'en'},
	// 	{title:'Russian', locale:'ru'},
	// 	{title:'Hindi', locale:'hi'},
	// 	{title:'Punjabi', locale:'pu'}
	// ]
	languages : [
		{"title":"العربية‎", "locale": "ar", rtl: true },
		{"title":"Български", "locale": "bg" },
		{"title":"বাংলা", "locale": "bn" },
		{"title":"English", "locale": "en" },
		{"title":"Español", "locale": "es" },
		{"title":"Greek", "locale": "el" },
		{"title":"Esti", "locale": "et" },
		{"title":"Français", "locale": "fr" },
		{"title":"Deutsch", "locale": "de" },
		{"title":"Danish", "locale": "da" },
		{"title":"Czech", "locale": "cs" },
		{"title":"Farsi", "locale": "fa" },
		{"title":"Finnish", "locale": "fi" },
		{"title":"Filipino", "locale": "fil" },
		{"title":"עברית", "locale": "he", rtl: true },
		{"title":"Hindi", "locale": "hi" },
		{"title":"Croatian", "locale": "hr" },
		{"title":"Hungarian", "locale": "hu" },
		{"title":"Italiano", "locale": "it" },
		{"title":"Icelandic", "locale": "is" },
		{"title":"Indonesian", "locale": "id" },
		{"title":"日本語", "locale": "ja" },
		{"title":"Korean", "locale": "ko" },
		{"title":"Korean", "locale": "kr" },
		{"title":"Lithuanian", "locale": "lt" },
		{"title":"Norwegian", "locale": "nb" },
		{"title":"Dutch", "locale": "nl" },
		{"title":"Norwegian", "locale": "no" },
		{"title":"Polski", "locale": "pl" },
		{"title":"PortuguÃªs", "locale": "pt" },
		{"title":"PortuguÃªs (Brazil)", "locale": "pt_BR" },
		{"title":"Romanian", "locale": "ro" },
		{"title":"Русский", "locale": "ru" },
		{"title":"Slovak", "locale": "sk" },
		{"title":"Serbian", "locale": "sr" },
		{"title":"Slovenian", "locale": "sl" },
		{"title":"Swedish", "locale": "sv" },
		{"title":"Tamil", "locale": "ta" },
		{"title":"Thai", "locale": "th" },
		{"title":"Turkish", "locale": "tr" },
		{"title":"Ukrainian", "locale": "uk" },
		{"title":"Urdu", "locale": "ur" },
		{"title":"Vietnamese", "locale": "vi" },
		{"title":"Mongolian", "locale": "mn" },
		{"title":"中文", "locale": "zh" }
	],
	aliases : {
		"en-GB": "en",
		"en-US": "en",
		"zh-CN": "zh",
		"zh-TW": "zh"
	}

}

i18n.entries = {};
i18n.locale = BaseElement.getLocalSetting('i18n-locale', 'en');
i18n.entries[i18n.hash('Hello')] = {
	en: "Hello",
	ru : 'Ð-Ð´Ñ€Ð°Ð²ÑÑ‚Ð²ÑƒÐ¹Ñ‚Ðµ',
	pu: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
	hi: 'नमस्ते!'
}

window.addEventListener("flow-i18n-entries", e=>{
	i18n.setEntries(e.detail.entries);
})

let Mixin = (Base, tag)=>{
	class Child extends Base{
		connectedCallback() {
			if(!this.innerHTML_)
				this.innerHTML_ = i18n.cleanText(this.innerHTML);
			this._cb = this._cb || this.onLocaleChange.bind(this);
			window.addEventListener("flow-i18n-locale", this._cb)
			this.onLocaleChange();
		}

		disconnectedCallback(){
			this._cb && window.removeEventListener("flow-i18n-locale", this._cb)
		}

		onLocaleChange(){
			this.innerHTML = this.htmlToElement(i18n.t(this.innerHTML_))
		}
		htmlToElement(html) {
		    let template = document.createElement('template');
		    template.innerHTML = `<span>${html.trim()}</span>`;
		    return template.content.firstChild.innerHTML;
		}
	}

	customElements.define('i18n-'+tag, Child, {extends: tag});

}

Mixin(HTMLDivElement, 'div');
Mixin(HTMLSpanElement, 'span')
Mixin(HTMLParagraphElement, 'p')
Mixin(HTMLLabelElement, 'label')
Mixin(HTMLTableCellElement, 'td')
Mixin(HTMLTableCellElement, 'th')
Mixin(HTMLAnchorElement, 'a')

export const buildLitHTML = (...strParts)=>{
	let strings = [...strParts];
	strings.raw = [];
	return html(strings);
}

export const i18nFormat = (str, ...values)=>{
	str = i18n.t(str);
	values.forEach(n=>{
		str = str.replace('[n]', n)
	})
	return str;
}

export const i18nHTMLFormat = (str, ...values)=>{
	str = i18n.t(str);
	values.forEach(n=>{
		str = str.replace('[n]', n)
	})
	return buildLitHTML(str);
}

class I18nDirective extends AsyncDirective{
	constructor(...args){
		super(...args);
		i18nDirMap.set(this, {});
	}
	render(text) {
		this.__text = text;
		return i18n.t(text);
	}

	disconnected() {
		i18nDirMap.delete(this);
	}

	reconnected() {
		i18nDirMap.set(this, {});
	}
}

const T = directive(I18nDirective);

let onLocaleChange = ()=>{
	let ce = new CustomEvent("flow-i18n-locale", {detail:{locale:i18n.locale}})
	window.dispatchEvent(ce);

	i18nDirMap.forEach((v, dir)=>{
		//console.log("dir", dir)
		dir.setValue(dir.__text?i18n.t(dir.__text):'')
	})

	i18nElementsMap.forEach((v, ele)=>{
		//console.log("dir", dir)
		ele.setI18nValue(ele.__i18nText?i18n.t(ele.__i18nText):'')
	})
}

i18n.setLocale(i18n.locale);


export class FlowI18nDialog{
	static open(alignTarget){
		if(this.dialog)
			return
		this._click = this._click || this.onClick.bind(this);
		
		let p = this._open(alignTarget);
		setTimeout(()=>{
			window.addEventListener("click", this._click)
		}, 100);
		return p;
	}
	static close(data){
		if(this.dialog){
			this.dialog.resolve(data);
			this.dialog = null;
		}
		this.removeEventListener();
	}
	static onClick(e){
		if(!this.dialog){
			this.removeEventListener();
			return
		}
		let t = e.target;
		let menu = t && t.closest && t.closest("flow-dialog.flow-menu");
		if(menu != this.dialog){
			this.removeEventListener();
			this.close();
		}
	}
	static removeEventListener(){
		window.removeEventListener("click", this._click)
	}
	static _open(alignTarget){
		let menuClick = e=>{
			let li = e.target.closest("li");
			let locale = li.getAttribute("data-locale");
			i18n.setLocale(locale);
			dialog.resolve({locale});
			this.dialog = false;
			this.removeEventListener();
		}

		let body = html
			`<ul class="menu" @click="${menuClick}">${
				config.languages.filter(l=>l.active).map(l=>html
					`<li data-locale="${l.locale}" 
						class="${l.locale==i18n.locale?'active':''}">${l.title}</li>`
				)
			}</ul>`

		let promise = FlowDialog.show({
			body,
			btns:[],
			cls:"flow-menu hide-close-btn",
			modal:false
		})

		let {dialog} = promise;
		this.dialog = dialog;
		if(alignTarget){
			let dialogBox = dialog.getBoundingClientRect();
			FlowDialog.alignTo(alignTarget, dialog, {
				targetPos:'right-bottom',
				dialogPos:'left-top',
				hOffset: -dialogBox.width,
				vOffset: 2
			})
		}

		return promise
	}
}


//window.xxxxx_setLocale = i18n.setLocale.bind(i18n)


export class I18nTest extends LitElement{
	static get styles(){
		return css`:host{display:inline-block;border:1px solid #DDD;padding:10px;}`
	}
	static get properties(){
		return {
			loop:{type:Boolean}
		}
	}
	constructor(){
		super();
		this.start();
	}
	start(){
		let i=0, ls = ['ru', 'pu', 'hi', 'en'];
		this.intervalId = setInterval(()=>{
			let l = ls[i++];
			if(!l){
				if(this.loop){
					i=0;
					l = ls[i++];
				}else{
					this.remove();
					clearInterval(this.intervalId);
				}
			}
			i18n.setLocale(l)
		}, 1000)
	}
	render(){
		return html`Hello: ${T('Hello')} <div title="${T('abc')}">How are You</div>`
	}
}

customElements.define('i18n-test', I18nTest);
customElements.define('flow-i18n', i18n);


export {i18n, T}


