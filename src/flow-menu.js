import {BaseElement, html, css} from './base-element.js';

/**
 * @export
 * @class FlowMenu
 * @extends {BaseElement}


 * 
 * @example
 * <flow-menu selected="one">
 * 	<flow-menu-item value="one">One</flow-menu-item>
 * 	<flow-menu-item value="two">Two</flow-menu-item>
 * </flow-menu>
 */

 export class SelectOption{
	constructor(text, value){
		this.text = text;
		this.value = value;
	}
}

export class FlowMenu extends BaseElement {
	static get properties() {
		return {
			selected:{type:String, reflect:true},
			selector:{type:String},
			valueAttr:{type:String},
			multiple:{type:Boolean}
		}
	}

	static get styles() {
		return css`
		:host{
			display:block;padding:5px 0px;
			--flow-menu-item-margin-internal: var(--flow-menu-item-margin, 1px);
			--flow-menu-item-margin-internal2x:calc(var(--flow-menu-item-margin-internal) * 2);
		}

		::slotted(flow-menu-item){
			display:flex;align-items:center;
		}
		
		::slotted(flow-menu-item),
		::slotted(.menu-item),
		.menu-item{
			box-sizing:border-box;
			cursor:pointer;user-select:none;
			padding:var(--flow-menu-item-padding, 10px);
			margin:var(--flow-menu-item-margin-internal);
			background-color:var(--flow-menu-item-bg, var(--flow-background-color));
			color:var(--flow-menu-item-color, var(--flow-color));
			pointer-events:auto;
		}
		::slotted(flow-menu-item:hover:not(.disabled):not(.selected)),
		::slotted(.menu-item:hover:not(.disabled):not(.selected)),
		.menu-item:hover:not(.disabled):not(.selected){
			background-color:var(--flow-menu-item-hover-bg, #DDD);
			color:var(--flow-menu-item-hover-color, #000);
		}
		::slotted(flow-menu-item.selected),
		::slotted(.menu-item.selected),
		.menu-item.selected{
			background-color:var(--flow-menu-item-selected-bg, var(--flow-primary-color));
			color:var(--flow-menu-item-selected-color, var(--flow-primary-invert-color));
		}
		:host(.grid),
		:host(.grid) .menu-list-container{
			display:flex;
			flex-wrap:wrap;
			width:var(--flow-menu-grid-width, 500px);
		}
		:host(.grid.full),
		:host(.grid.full) .menu-list-container{
			width:var(--flow-menu-gridfull-width, 1000px);
		}
		:host(.grid:not(.full)) ::slotted(flow-menu-item),
		:host(.grid:not(.full)) ::slotted(.menu-item),
		:host(.grid:not(.full)) .menu-item{
			min-width:calc(20% - var(--flow-menu-item-margin-internal2x));
			max-width:calc(20% - var(--flow-menu-item-margin-internal2x));
		}
		:host(.grid.full) ::slotted(flow-menu-item),
		:host(.grid.full) ::slotted(.menu-item),
		:host(.grid.full) .menu-item{
			min-width:var(--flow-menu-gridfull-item-min-width, 100px);
			max-width:var(--flow-menu-gridfull-item-max-width, initial);
			flex:var(--flow-menu-gridfull-item-flex, 1);
		}
		::slotted(div.divider),
		::slotted(div.section){
			padding:var(--flow-menu-divider-padding, 10px);
			box-shadow:var(--flow-menu-divider-box-shadow, var(--flow-box-shadow));
			margin:var(--flow-menu-divider-margin, 0 0 5px 0);
			background-color:var(--flow-menu-divider-bg-color, var(--flow-background-inverse-soft));
			color:var(--flow-menu-divider-color, var(--flow-background-color));
		}
		::slotted(flow-menu-item.disabled),
		::slotted(.menu-item.disabled),
		.menu-item.disabled{
			cursor:var(--flow-menu-disabled-item-cursor, default);
			opacity:var(--flow-menu-disabled-item-opacity, 0.7);
		}
		`;
	}
	constructor(){
		super();
		this.selected = "";
		this.selector = "flow-menu-item, .menu-item";
		this.valueAttr = "value";
		this._selected = []
	}
	render(){
		return html`
		<slot></slot>
		`;
	}
	static SelectOption=SelectOption
	static createOption(text, value, cls=""){
		return {text, value, cls};
	}
	static createOptionItem(text, value, cls=""){
		let isDivider = cls.includes("divider")||cls.includes("section")
		let item = document.createElement(isDivider?"div":"flow-menu-item");
		if(cls){
			item.setAttribute("class", cls);
		}
		item.setAttribute("value", value);
		item.innerHTML = text;
		return item;
	}
	static createOptionItems(items=[]){
		return items.map(item=>{
			return this.createOptionItem(item.text, item.value, item.cls||"")
		})
	}
	changeOptions(items=[]){
		let children = this.querySelectorAll("*");
		children.forEach(c=>{
			c.remove();
		});

		FlowMenu.createOptionItems(items).forEach(el=>{
			this.appendChild(el)
		})
		this.onSlotChange();
	}
	firstUpdated(){
		this.renderRoot
			.addEventListener("click", this._onClick.bind(this));

		let slot = this.renderRoot.querySelector('slot');
		this.listSlot = slot;
		if(slot){
			slot.addEventListener('slotchange', (e)=>{
				//let items = slot.assignedElements();
				//this.items = items
				//TODO update selection 
				this.onSlotChange()
			});
		}
	}
	onSlotChange(){
		this.updateList();
	}
	updated(changes){
		//this.log("changes", changes)
		if(changes.has("selected")){
			this.parseSelected();
			this.requestUpdate("_selected")
		}

		this.updateList(changes)
		super.updated(changes)
	}

	parseSelected(){
		let {selected} = this;
		this.log("parseSelected:selected:"+JSON.stringify(selected), selected)
		if(this.multiple){
			if(!Array.isArray(selected)){
				try{
					selected = JSON.parse(selected);
				}catch(e){
					selected = undefined;
				}
				if(selected !== undefined)
					selected = [selected];
				else
					selected = [];
			}
		}else{
			if(Array.isArray(selected))
				selected = selected[0];
			if(selected !== undefined)
				selected = [selected];
			else
				selected = []
		}
		selected = selected.filter(s=>s!==undefined).map(s=>s+"");
		//this.log("updated:selected", selected)
		this.select(selected);
	}

	get list(){
		if(!this.listSlot)
			return [];
		return this.listSlot
			.assignedElements()
			.filter(item=>item.matches(this.selector))
	}

	updateList(){
		this.list.forEach(item=>{
			let value = item.getAttribute(this.valueAttr)
			item.onclick = ()=>{};//<--- iphone issue
			item.classList.toggle("selected", this.isSelected(value));
		});
	}

	isSelected(value){
		return this._selected.includes(value);
	}

	_onClick(e){
		let target = e.target.closest(this.selector);
		if(!target || target.classList.contains("disabled"))
			return
		let value = target.getAttribute(this.valueAttr);
		if(this.multiple)
			this.toggle(value);
		else
			this.selectOne(value)
	}
	selectFirst(){
		let item = this.list[0];
		if (item){
			let value = item.getAttribute(this.valueAttr);
			this.selectOne(value);
			return value;
		}
		return "";
	}
	selectOne(value){
		this._selected = [value];
		this.selectionChanged();
	}
	select(values){
		this._selected = values;
		this.selectionChanged();
	}
	toggle(value){
		let index = this._selected.indexOf(value);
		if(index<0)
			this._selected.push(value);
		else
			this._selected.splice(index, 1);
		this.selectionChanged();
	}
	selectionChanged(){
		this.updateList()
		let selected = this._selected.slice(0);
		let selected_str;
		if(!this.multiple){
			selected = selected[0];
			selected_str = selected;
		}else{
			selected_str = JSON.stringify(selected)
		}
		this.selected = selected_str;
		this.fire("select", {selected}, {bubbles:true})
	}
	get value(){
		if(!this.multiple)
			return this._selected[0]
		return this._selected
	}
}

FlowMenu.define('flow-menu');
