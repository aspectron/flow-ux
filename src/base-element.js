import {LitElement, html, css} from 'lit-element';

export * from 'lit-element';
export * from 'lit-html/lit-html.js';

let {debug, baseUrl, theme} = window.flowConfig || {}
let {iconPath, icons, resolveIcon, iconMap, iconFile} = theme || {};

if(!baseUrl){
	baseUrl = (new URL("../", import.meta.url)).href;
	debug && console.log("FlowUX: baseUrl", baseUrl)
}

let IconMap = Object.assign({
	fal:'light',
	far:'regular',
	fab:'brands',
	fa: 'solid',
	fas:'solid'
}, iconMap || {});

iconFile = iconFile||'icons';
let NativeIcons = baseUrl+'resources/icons/sprites/';
let FlowIconPath = iconPath || NativeIcons;
let FlowIcons = icons || {};

if(!resolveIcon){
	resolveIcon = (cname, name, i)=>{
		if(!name)
			return `${cname}:invalid icon`;
		if(/\.(.{3,4}|.{3,4}#.*)$/.test(name))
			return name
		
		let icon = FlowIcons[`${cname}:${name}${i?'-'+i:''}`]
			||FlowIcons[name]
			||(name.indexOf(":")>-1?name:iconFile+':'+name);

		if(/\.(.{3,4}|.{3,4}#.*)$/.test(icon))
			return icon

		let [file, hash] = icon.split(":");
		if(file == "icons")
			return `${NativeIcons}icons.svg#${hash}`;
		return `${FlowIconPath}${IconMap[file]||file}.svg#${hash}`;
	}
}
console.log("FlowIcons", FlowIcons)

export {baseUrl, debug, FlowIconPath, FlowIcons};

/**
* @class BaseElement
* @extends LitElement
*/
export class BaseElement extends LitElement{

	static get baseUrl(){
		return baseUrl;
	}

	static hashCode(str){//java String#hashCode
	    var hash = 0;
	    for (var i = 0; i < str.length; i++) {
	       hash = str.charCodeAt(i) + ((hash << 5) - hash);
	    }
	    return hash;
	} 

	static intToRGB(i){
	    var c = (i & 0x00FFFFFF)
	        .toString(16)
	        .toUpperCase();

	    return "00000".substring(0, 6 - c.length) + c;
	}

	/**
	* convert any string to color hex code
	* @param {String} str any string i.e 'hello'
	* @return {String} color hex code i.e `#DDFFAA`
	*/
	static strToColor(str){
		return '#'+this.intToRGB(this.hashCode(str));
	}

	/**
	* @desc define customElements. you can call on drived/child class as <code class="prettyprint js">CoolElement.define('my-cool-element')</code>
	* @param {String} name name of tag i.e. 'my-cool-element'
	* @since 0.0.1
	*/
	static define(name){
		customElements.define(name, this);
	}

	static get svgStyle(){
		return css`
			svg.icon{
				width:28px;
				height:28px;
				margin:0px 5px;
				fill:var(--flow-primary-color);
			}
		`
	}

	static setLocalSetting(name, value){
		if(!window.localStorage)
			return

		window.localStorage['flow-'+name] = value;
	}

	static getLocalSetting(name, defaults){
		if(!window.localStorage)
			return defaults;

		let value = window.localStorage['flow-'+name];
		if(typeof(value) == 'undefined')
			return defaults

		return value;
	}

	constructor(){
		super();
		const name = this.constructor.name;
		this.__cname = name.toLowerCase().replace("flow", "");
		this.log = Function.prototype.bind.call(
			console.log,
			console,
			`%c[${name}]`,
			`font-weight:bold;color:${this.constructor.strToColor(name)}`
		);
	}

	cloneValue(value){
		if( value instanceof Array )
			return value.map(v=>this.cloneValue(v))
		else if( value instanceof Object ){
			let r = {}
			Object.entries(value).forEach( ([k,v])=>{
				r[k] = this.cloneValue(v);
			})
			return r;
		}

		return value;	
	}

	/**
	* update the property by its path
	* @param {String} path propery path i.e `tabs.2.disable`
	* @param {*} value new value
	*
	*/
	set(path, value){
		const parts = path.split(".");
		let v = this;
		let last = parts.length-1;
		let updated = false;
		let lastValue = this.cloneValue(v[parts[0]]);
		
		parts.find((p, i)=>{
			if( !(v instanceof Object) )
				return
			if(i==last){
				v[p] = value;
				//this.log("v, p, i, v", {v, p, i, value})
				updated = true;
				return true;
			}
			v = v[p];
		})
		if(updated){
			this.requestUpdate(parts[0], lastValue)
			//this.log("requestUpdate, prop, lastValue", parts[0], lastValue)
		}
		return updated;
	}

	/**
	* fire CustomEvent
	* @param {String} eventName name of event
	* @param {Object=} detail event's [detail]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail} property
	* @param {Object=} options [CustomEventInit dictionary]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent}
	* @param {HTMLElement=} event target (default: this element)
	* @return {boolean} The return value is false if event is cancelable and at least one of the event handlers which handled this event called Event.preventDefault(). Otherwise it returns true.
	* @since 0.0.1
	*/
	fire(eventName, detail={}, options={}, el=null){
		let ev = new CustomEvent(eventName, Object.assign({}, options, {detail}));
		return (el || this).dispatchEvent(ev);
	}

	/**
	* debounce provided function for given time
	* @param {String} name key name to debounce function
	* @param {Function} fn a function to debounce
	* @param {Number} time time in milliseconds for delay
	* @return {Object} a reference to debounced function
	* @since 0.0.1
	*/
	debounce(name, fn, time){
		this._debounce = this._debounce || {};
		if(this._debounce[name])
			this._debounce[name].cancel();

		this._debounce[name] = {
			id:setTimeout(fn, time),
			cancel(){
				if(!this.id){
					clearTimeout(this.id)
					this.id = null;
				}

			}
		}

		return this._debounce[name];
	}

	buildUrl(url){
		return this.constructor.baseUrl + url;
	}
	iconPath(name, i){
		return resolveIcon(this.__cname, name, i);
	}

	/**
	* Logs given values
	* @param {...*} args
	*/
	log(...args){
	}
}

let getLocalSetting = BaseElement.getLocalSetting.bind(BaseElement);
let setLocalSetting = BaseElement.setLocalSetting.bind(BaseElement);
export {getLocalSetting, setLocalSetting}
