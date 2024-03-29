import {FlowSelect} from './flow-select.js';
import {css} from './base-element.js';


export class FlowSelector extends FlowSelect{

    
    static get properties(){
        return {
            mergeProps:{type:String},
            mergeAttributes:{type:String},
            mergeInnerHTML:{type:Boolean}
        }
    }

    static get styles(){
        return [FlowSelect.styles, css`
            :host{
                --flow-select-input-height:var(--flow-selector-input-height, auto);
                width:var(--flow-selector-width, unset);
            }
            flow-dropdown{
                width:var(--flow-selector-dropdown-width, auto);
            }
            .input.selected{
                min-height:var(--flow-selector-selected-min-height, 50px);
                min-width:var(--flow-selector-selected-min-width, 10px);
                width:var(--flow-selector-selected-width, 100%);
                font-size:0px;display:flex;align-items:center;
                box-sizing:border-box;
                padding:var(--flow-selector-selected-padding, 16px 30px 10px 10px);
                flex-wrap:var(--flow-selector-selected-flex-wrap, wrap);
            }
            .input.selected::after{
                top:calc(50% - 2px);
            }
            .input.selected .item{
                margin:var(--flow-selector-item-margin, 0px);
                font-size:var(--flow-selector-item-line-height, 1rem);
                line-height:var(--flow-selector-item-line-height, 1.1);
            }
            :host([multiple]) .selected .item{
                margin:var(--flow-selector-multiple-item-margin, 0px 5px 5px 0px);
            }
        `]
    }

    constructor(){
        super();
        this.mergeProps = "";
    }

    renderSelected(){
        let map = new Map();
        this.list.forEach(item=>{
            map.set(item.getAttribute(this.valueAttr), item)
        })
        return this._selected.map(value=>{
            let item = map.get(value)
            if(!item)
                return
            let clone = item.cloneNode(this.mergeInnerHTML||false);
            clone.removeAttribute('flow-select-filtred')
            clone.classList.remove("menu-item", "selected");
            clone.classList.add("item")
            return this.mergeNobeProperties(clone, item);
        }).filter(item=>!!item)
    }

    get selectedNodes(){
        let map = new Map();
        this.list.forEach(item=>{
            map.set(item.getAttribute(this.valueAttr), item)
        })
        return this._selected.map(value=>{
            return map.get(value)
        }).filter(item=>!!item)
    }

    mergeNobeProperties(clone, org){
        let props = [];
        if(this.mergeProps){
            props = this.mergeProps.split(",")
        }else if(org.constructor?.properties){
            props = Object.keys(org.constructor?.properties||{})
        }
        props.forEach(p=>{
            clone[p] = org[p];
        })
        if(this.mergeAttributes){
            let attributes = this.mergeAttributes.split(",");
            attributes.forEach(name=>{
                if(!name)
                    return
                clone.setAttribute(name, org.getAttribute(name));
            })
        }
        return clone;
    }
}

FlowSelector.define('flow-selector');
