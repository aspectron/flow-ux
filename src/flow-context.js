import {BaseElement, html, css, ScrollbarStyle} from './base-element.js';
export const FlowContextWorkspaces = new Map();
export const FlowContexts = new Map();
const boxStyle = css`
:host{
	display:block;padding:5px;border-radius:3px;margin-top:5px;
	border:1px solid var(--flow-border-color, var(--flow-primary-color, rgba(0,151,115,1)));
}
.head{
	display:flex;align-items:center;
	padding:5px;
}
.head .name{
	flex:1;overflow:hidden;text-overflow:ellipsis;
	margin-right:10px;
}
.head fa-icon{margin:5px;}
fa-icon[disabled]{
	pointer-events:none;opacity:0.5;
}
fa-icon:not([disabled]){cursor:pointer}
`

let workspaceCount = 0;

export class FlowContextWorkspaceItem extends BaseElement{
	static get properties(){
		return {
			data:{type:Object}
		}
	}
	static get styles(){
		return css`
			:host{
				display:flex;align-items:center;
			}
			:host(.item){
				padding:5px;margin:0px 2px 2px 0px;
				border-radius:3px;
				border:1px solid var(--flow-border-color, var(--flow-primary-color, rgba(0,151,115,1)));
			}
		`
	}
	render(){
		let {data={name:""}} = this;
		//console.log("WorkspaceItem:data", this, this.parentNode, data.name, JSON.stringify(data))
		return html`${data.name||""}`
	}
}

FlowContextWorkspaceItem.define("flow-context-workspace-item");

export const objectToProperties = config=>{
	let props = {};
	for (const [key, value] of Object.entries(config)) {
		if(value.value !== undefined && value.type){
			props[key] = value;
			continue;
		}
		props[key] = {String, value};
	}

	return props;
}

export class FlowContextElement extends BaseElement{
	static get properties(){
		return {
			name:{type:String, value:""},
			type:{type:String, value:""},
			code:{type:String, value:""}
		}
	}
	static get styles(){
		return [boxStyle, css`
			:host{display:inline-block;padding:5px;margin:0px 5px 5px;}
		`]
	}
	static init(){
		let {code} = this.properties;
		code = code&&code.value;
		if(!FlowContexts.has(code)){
			FlowContexts.set(code, this);
			this.define(`flow-ctx-${code}`)
		}
	}

	static get info(){
		let info = {};
		Object.keys(this.properties).forEach(key=>{
			info[key] = this.properties[key].value;
		});
		return info;
	}

	render(){
		return html`
		<div class="head">
			<span class="name">${this.name||''}</span>
			<fa-icon icon="trash-alt" @click="${this.onRemoveClick}"></fa-icon>
		</div>
		${this.renderBody()}`
	}
	constructor(){
		super();
		this.initPropertiesDefaultValues();
	}
	onRemoveClick(){
		this.fire("remove-ctx-request", {code:this.code}, {bubbles:true})
	}
	renderBody(){
		return '';
	}
	buildConfig(){
		let {code, type, name} = this;
		let result = {name, type, code};
		result.config = this.getConfig();
		return result;
	}
	setConfig(){

	}
	getConfig(){
		return {};
	}
}

export class FlowContextWorkspaceElement extends BaseElement{
	static get properties(){
		return {
			name:{type:String, value:""},
			code:{type:String, value:""},
			contexts:{type:Array, value:[]}
		}
	}
	static init(){
		let {code} = this.properties;
		code = code&&code.value;
		if(code){
			if(!FlowContextWorkspaces.has(code)){
				FlowContextWorkspaces.set(code, this);
				this.define(`flow-ctxworkspace-${code}`)
			}
		}
	}
	static get info(){
		let info = {};
		Object.keys(this.properties).forEach(key=>{
			info[key] = this.properties[key].value;
		});
		return info;
	}
	static createContextNode(code, attr, props){
		let el = this.createElement(`flow-ctx-${code}`, attr, props);
		el.classList.add("flow-context");
		return el;
	}
	static createContextWorkspaceNode(code, attr, props){
		let el = this.createElement(`flow-ctxworkspace-${code}`, attr, props);
		el.classList.add("flow-workspace");
		return el;
	}
	static get styles(){
		return boxStyle;
	}
	

	render(){
		let contexts = this.contexts;
		console.log("contexts", contexts)
		let hasAddable = this.getAddableContexts().length
		return html`
		<div class="head">
			<span class="name">
				<flow-input label="Workspace Name" 
					class="name-input" .value="${this.name}">
				</flow-input>
			</span>
			<fa-icon icon="plus-circle" ?disabled=${!hasAddable} 
				@click="${this.onAddContextClick}"></fa-icon>
			<fa-icon icon="trash-alt" @click="${this.onRemoveWorkspaceClick}"></fa-icon>
		</div>
		<div class="contexts" @remove-ctx-request=${this.onRemoveContext}>
		${contexts.map(ctx=>{
			let el = this.constructor.createContextNode(ctx.code);
			if(ctx.config)
				el.setConfig(ctx.config);
			return el;
		})}
		</div>`
	}

	buildConfig(){
		let {name, code} = this; 
		let config = {name, code};
		let contexts = this.renderRoot.querySelectorAll(".flow-context");
		config.contexts = [...contexts].map(ctx=>ctx.buildConfig());
		return config;
	}

	onRemoveContext(e){
		let index = this.contexts.findIndex(c=>c.code == e.detail.code);
		if(index >-1){
			this.contexts.splice(index, 1);
			this.requestUpdate("contexts")
		}
	}

	getAddableContexts(){
		return [...FlowContexts.values()].map(ctx=>ctx.info).filter(ctx=>{
			return !this.contexts.find(c=>c.code==ctx.code)
		});
	}

	onAddContextClick(e){
		//this.fire('add-context', {code:this.code}, {bubbles:true})
		let items = this.getAddableContexts();
		//console.log("items", items)
		let body = html`<flow-menu data-name="contexts" multiple>
			${items.map(item=>{
				return html`<flow-menu-item value="${item.code}">${item.name}</flow-menu-item>`
			})}
			</flow-menu>`;

		FlowDialog.show({
			body,
			hideCloseBtn:true,
			compact:true,
			btns:[{
				text:"Close",
				handler:(resolve, result)=>{
					resolve();
				}
			},{
				text:"Done",
				cls:"primary",
				handler:(resolve, result)=>{
					resolve();
					let {contexts} = result.values;
					contexts = contexts.map(code=>{
						return {code};
					})
					console.log("result", contexts)
					if(contexts.length)
						this.contexts = [...contexts, ...this.contexts];
				}
			}]
		});
	}

	constructor(){
		super();
		this.initPropertiesDefaultValues();
	}
}

export const FlowContext = (config, base)=>{
	let props = objectToProperties(config);
	class klass extends (base||FlowContextElement){
		static get properties(){
			return props;
		}
	}

	klass.init();
}

export const FlowContextWorkspace = (config, base)=>{
	let props = objectToProperties(config);
	class klass extends (base||FlowContextWorkspaceElement){
		static get properties(){
			return props;
		}
	}

	klass.init();
}

export const FlowContextListenerMixin = base=>{
	class FlowContextListener extends base{
		static get properties(){
			return {
				ctxworkspaces:{type:Array, value:[]}
			}
		}
		acceptContext(context){
			return !!context.type;
		}
		onContextsUpdate(){
			//
		}
		getContextManagerConfig(){
			return {
				workspaces:this.ctxworkspaces||[],
				multiWorkspace:true
			}
		}
		setContextManagerConfig(config){
			let {workspaces} = config;
			this.ctxworkspaces = workspaces;
			this.onContextsUpdate();
		}

		openContextManager(){
			FlowContextManager.open(this);
		}

		serialize(){
			let {ctxworkspaces} = this;
			return Object.assign({}, super.serialize(), {
				ctxworkspaces
			});
		}
		deserialize(data){
			super.deserialize(data);
			let {ctxworkspaces=[]} = data||{};
			console.log("got contexts", data)
			this.ctxworkspaces = ctxworkspaces;
		}
	}

	return FlowContextListener;
}

export class FlowContextManager extends BaseElement{
	static get properties(){
		return {
			selected:{type:Array, value:[]}
		}
	}

	static get styles(){
		return [ScrollbarStyle, css `
			:host{--fa-icon-size:20px;}
			dialog{
				display:flex;padding:0px;height:700px;
				width:800px;max-width:95vw;
				max-height:95vh;flex-direction:column;
			    border:var(--flow-context-manager-dialog-border, 2px solid var(--flow-primary-color, #025763));
			    border-radius:var(--flow-context-manager-dialog-border-radius, 4px);
			    min-width:var(--flow-context-manager-dialog-min-width, 300px);
			    min-height:var(--flow-context-manager-dialog-min-height, 200px);
			}
			.head,.header{
				display:flex;align-items:center;justify-content:center;
				padding:var(--flow-context-manager-head-padding, 10px);
			}
			.head-text{
				flex:1;overflow:hidden;text-overflow:ellipsis;
				font-size:var(--flow-context-manager-head-text-font-size, 1.2rem);
				margin-right:15px;
			}
			.header{
				padding:var(--flow-context-manager-header-padding, 5px);
			}
			.workspace-selector{flex:1;--flow-selector-dropdown-width:100%;}
			.close-icon{cursor:pointer;--fa-icon-size:20px;}
			.body{
				padding:var(--flow-context-manager-body-padding, 10px);
				flex:1;overflow:auto;
			}
			.buttons{
			    margin:10px;display:flex;flex-wrap:wrap;justify-content:flex-end;
			}
			.buttons flow-btn{margin:0px 5px;align-items:center;display:flex;}
			.buttons flow-btn:last-child{margin-right:0px;}
			.buttons flow-btn:first-child{margin-left:0px;}
		`];
	}

	static get _tagName(){
		return 'flow-context-manager';
	}

	static getContextManager(){
		let ctxManger = document.querySelector(this._tagName);
		if(ctxManger)
			return ctxManger;
		ctxManger = document.createElement(this._tagName);
		document.body.appendChild(ctxManger);
		return ctxManger;
	}

	static open(cmp){
		let ctxManger = this.getContextManager();
		ctxManger.showModal(cmp)
	}

	render(){
		return html`
		<dialog @close=${this.onDialogClose}>
			<div class="head">
				<span class="head-text">${this.heading||'Context Manager'}</span>
				<fa-icon class="close-icon" @click="${this.onCloseClick}" icon="times"></fa-icon>
			</div>
			<div class="header">
				${this.renderWorkspaceSelector()}
				<flow-btn @click="${this.onCreateWorkspaceClick}" >
					<fa-icon class="add-icon" icon="plus"></fa-icon>
				</flow-btn>
			</div>
			<div class="body">
				<div @select="${this.onCtxSelectionChange}">
				${this.renderWorkspaces()}
				</div>
			</div>
			<div class="buttons">
				<flow-btn @click="${this.onCloseClick}">Close</flow-btn>
				<flow-btn @click="${this.onDoneClick}" class="primary">Done</flow-btn>
			</div>
		</dialog>`;
	}

	constructor(){
		super();
		this.initPropertiesDefaultValues();
	}

	renderWorkspaceSelector(){
		let workspaces = [...FlowContextWorkspaces.values()].map(w=>w.info);
		console.log("this.selected", this.selected)
		return html`<flow-selector class="workspace-selector" label="Select Workspace"
			?multiple=${this.multiWorkspace} .selected="${this.selected.slice(0)}"
			@select="${this.onWorkspacesSelectionChange}">
			${workspaces.map(w=>{
				return html`<flow-context-workspace-item value="${w.code}"
					class="menu-item" data-text="${w.name}" .data="${w}"></flow-context-workspace-item>`
			})}
		</flow-selector>`
	}

	renderWorkspaces(){
		let workspaces = this.getWorkspacesConfig();
		let nodes = workspaces.map(w=>{
			return FlowContextWorkspaceElement.createContextWorkspaceNode(w.code)
		});
		return nodes;
	}

	onCreateWorkspaceClick(){
		let code = `workspace-${++workspaceCount}`;
		FlowContextWorkspace({
			name:`Workspace ${workspaceCount}`,
			code,
			contexts:[]
		});
		if(this.multiWorkspace){
			this.selected.push(code);
			this.requestUpdate("workspaces", null)
		}else{
			this.selected = [code]
		}
		console.log("onCreateWorkspaceClick", FlowContextWorkspaces, this.selected)
	}

	onWorkspacesSelectionChange(e){
		let {selected} = e.detail;
		this.selected = selected;
		console.log("Workspaces:selected", selected)
	}
	getWorkspacesConfig(){
		let config = [];
		let {workspacesMap} = this;
		this.selected.map(wCode=>{
			let workspace = (FlowContextWorkspaces.get(wCode)||{}).info;
			if(!workspace)
				return
			let workspaceConfig = workspacesMap.get(wCode);
			if(workspaceConfig){
				console.log("workspaceConfig", workspaceConfig)
				config.push(workspaceConfig);
				return
			}
			workspace = Object.assign({}, workspace);
			workspace.contexts = workspace.contexts.map(ctx=>{
				ctx = (FlowContexts.get(ctx.code||ctx)||{}).info;
				if(!ctx)
					return false;
				return ctx
			}).filter(ctx=>!!ctx);
			config.push(workspace);
		});

		return config;
	}

	firstUpdated(){
		this.dialog = this.renderRoot.querySelector('dialog');
		if(this._show)
			this[this._show]();
	}

	onCtxSelectionChange(){
		
	}

	onDialogClose(e){
		if(this._show){
			this[this._show]();
			return
		}
		let detail = {e};
		this.dispatchEvent(new CustomEvent('closed', {detail}))
	}

	showModal(cmp){
		let fromCloseEvent = !cmp;
		cmp = cmp || this.getHostComponent();
		if(!cmp)
			return
		let missingFn = [
			'getContextManagerConfig',
			'setContextManagerConfig',
			'acceptContext'
		].find(fn=>{
			return (typeof cmp[fn] != 'function');
		});

		if(missingFn)
			return this.log("showModal: missing function", missingFn);

		if(!fromCloseEvent)
			this.setHostComponent(cmp);
		this._show = 'showModal';
		if(this.dialog){
			console.log(this.dialog)
			return this.dialog.showModal();
		}
	}

	setHostComponent(cmp){
		this._cmp = cmp;
		if(cmp){
			let {workspaces, multiWorkspace} = cmp.getContextManagerConfig();
			this.selected = workspaces.map(workspace=>workspace.code);
			this.workspaces = workspaces;
			this.multiWorkspace = !!multiWorkspace;
		}else{
			this.selected = [];
			this.workspaces = [];
			this.multiWorkspace = false;
		}

		let {workspaces=[]} = this;
		this.workspacesMap = new Map();
		workspaces.forEach(workspace=>{
			this.workspacesMap.set(workspace.code, workspace);
			/*
			let {contexts=[]} = workspace;
			workspace.contexts = new Map();
			contexts.map(ctx=>{
				workspace.contexts.set(ctx.code, ctx);
			})
			*/
		})
	}
	getHostComponent(){
		return this._cmp;
	}

	onCloseClick(){
		this.close();
	}

	buildConfig(){
		let workspaces = this.renderRoot.querySelectorAll(".flow-workspace");
		return [...workspaces].map(w=>w.buildConfig());
	}

	onDoneClick(){
		let cmp = this.getHostComponent();
		if(!cmp){
			this.close();
			return
		}
		let workspaces = this.buildConfig();
		console.log("workspaces-config", workspaces);

		cmp.setContextManagerConfig({workspaces});
		this.close();
	}

	close(){
		this._show = false;
		this.setHostComponent(null);
		if(this.dialog)
			this.dialog.close();
	}

	destroy(){
		this.close();
		this.remove();
	}
}

FlowContextManager.define(FlowContextManager._tagName)

