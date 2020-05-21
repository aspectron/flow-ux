

import {BaseElement, html, css} from './base-element.js';


/**
* @class FlowWindowLink
* @extends BaseElement
* @property {String} [url]
* @property {String} [id]
* @property {String} [title]
* @property {Boolean} [disabled]
* @property {Boolean} [icon]
* @example
*   <flow-window-link href="url">text</flow-window-link>

* @cssvar {font-family} [--font-family=var(--flow-font-family, "Open Sans")]
* @cssvar {font-weight} [--font-weight=var(--flow-font-weight, normal)]
* @cssvar {color} [--flow-link-color=var(--flow-link-color, #017b68)]
* @cssvar {color} [--flow-link-hover-color=var(--flow-link-hover-color, #017b68)]
* @cssvar {fill} [--flow-primary-color=rgba(0,151,115,1)]
*/
export class FlowWindowLink extends BaseElement {
	static get properties() {
		return {
			disabled:{type:Boolean, reflect: true},
			icon:{type:Boolean, reflect: true},
			url : { type : String },
			id : { type : String },
			title : { type : String },
			width : { type : Number },
			height : { type : Number },
			resizable : { type : Boolean },
			frame : { type : Boolean },
			transparent : { type : Boolean }
		}
	}

	static get styles(){
		return css`
			:host{
				display:inline-block;
				font-family:var(--flow-font-family, "Open Sans");
				font-weight:var(--flow-font-weight, normal);
			}
			:host([disabled]){
				opacity:0.5;
				cursor:default;
				pointer-events:none;
			}
			:host(:not([disabled])){
				cursor:pointer;
			}

			.link-wrapper {
				color: var(--flow-link-color, #017b68);
				display: flex;
			}

			.link-wrapper:hover {
				color: var(--flow-link-hover-color, #017b68);
			}

			.icon-box {
				display: block;
				width: 16px;
				height: 16px;
				margin-bottom: -4px;
				opacity: 0.65;
			}

			.icon-box svg {
				fill: var(--flow-primary-color, #017b68);
				width: 100%;
				height: 100%;
			}

			.content {
				display: block;
			}
		`;
	}

	constructor(){
		super();

		this.width = 1024;
		this.height = 768;
		this.resizable = true;
		this.frame = true;
		this.transparent = false;
		this.show = true;

	}

	render() {
		let iconSrc = this.iconPath(`external-link-square-alt`);
		return html`
		<div class="link-wrapper" @click=${this.click}>
			<div class="content"><slot></slot></div>
			${ this.icon ? html`<div class="icon-box"><svg><use href="${iconSrc}"></use></svg></div>` : '' }
		</div>
		`;
	}

	click() {
		this.fire("flow-window-link-click", {el:this})
		console.log("opening url:",this.url);
		//require('nw.gui').Shell.openExternal( this.href );

		const { id, title, width, height, resizable, frame, transparent, show } = this;

        if(url && typeof nw != 'undefined') {
            nw.Window.open(url, {
				id, title, width, height, resizable, frame, transparent, show
                //new_instance: true,
                // id: this.id,
                // title: this.title,
                // width: 1027,
                // height: 768,
                // resizable: true,
                // frame: true,
                // transparent: false,
                // show: true,
                // http://docs.nwjs.io/en/latest/References/Manifest%20Format/#window-subfields
            }, (win, b) => {

                this.window = win;
                // console.log("win", win)
                // win.app = this;
                // global.abcapp = "123";
                resolve();
            });
        }

	}
}

FlowWindowLink.define('flow-window-link');