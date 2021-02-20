import {FlowEvents} from './flow-events.js';
import {dpc, UID} from './helpers.js';

export * from './flow-events.js';
export class FlowSocket {
	constructor(options){
		this.online = false;
		

		this.options = Object.assign({
			path:'/rpc',
			id:UID(),
			timeout:30,
			origin:window.location.origin
		}, options || {});

		this.timeout  = this.options.timeout;
		this.id = this.options.id;
		this.transport = this.options.transport || 'native';

		this.init();
	}

	init() {
		this.initEvent();
		this.connected = false;
		if (this.options.path)
			this.connect();
	}

	initEvent() {
		this.pending = new Map();
		this.events = new FlowEvents();
	}

	connect_impl() {

		switch(this.transport) {
			case 'native': {
				const url = this.options.origin.replace(/^http/,'ws')+this.options.path+'/websocket';
				// console.log('WS connecting to',url);
				this.socket_impl = new WebSocket(this.options.origin.replace(/^http/,'ws')+this.options.path+'/websocket');
			} break;

			case 'sockjs': {
				this.socket_impl = SockJS(this.options.origin+this.options.path, this.options.args || {});
			} break;
		}

		this.socket_impl.onopen=(event)=>{
			this.online = true;
			console.log("RPC connected");
			this.events.emit('open');
		}
		this.socket_impl.onerror=(err)=>{
			console.log("RPC connect_error", err);
			this.events.emit('connect.error', err);
			this.socket_impl.close();
//			this.reconnect_impl();
		}
		this.socket_impl.onmessage=(msg)=>{
			let [ event, data ] = JSON.parse(msg.data);
			this.intake.emit(event, data);
		}
		this.socket_impl.onclose=(event)=>{
			this.online = false;
			console.log("RPC disconnected");
			this.events.emit('disconnect');

			this.pending.forEach((info, id)=>{
				info.callback({ error : "Connection Closed"});
			});

			this.pending.clear();

			this.reconnect_impl();
		};
	}

	reconnect_impl() {
		dpc(1000, ()=>{
			this.connect_impl();
		})
	}

	async connect(){
		if (this._connected || !this.options.path)
			return;
		this._connected = true;
		this.events.emitAsync('rpc-connecting');
		//let io = this.options.io || window.SockJS;
		this.intake = new FlowEvents();
		this.socket = {
			on : (...args) => { this.intake.on(...args); },
			emit : (subject, msg) => { this.socket_impl.send(JSON.stringify([subject,msg])); }
		}
		this.socket.on('auth.setcookie', (msg)=>{
			document.cookie = msg.cookie;
		})
		this.socket.on('auth.getcookie', ()=>{
			let cookie = (document.cookie.length === 0) ? null : document.cookie;
			let response = {
				cookie: cookie
			}
			this.socket_impl.send(JSON.stringify(['auth.cookie', response]));
		})
		this.socket.on('ready', (msg) => {
			if(msg.websocketMode != this.options.websocketMode)
				throw new Error(`Error - incompatible websocket mode: client ${this.options.websocketMode} server: ${msg.websocketMode}`);
			this.events.emit('connect');
		})

		this.connect_impl();

		await this.initSocketHandlers();

		let timeoutMonitor = ()=>{
			let ts = Date.now();
			let purge = [ ]
			this.pending.forEach((info, id)=>{
				if(ts - info.ts > this.timeout * 1000) {
					info.callback({ error : "Timeout "});
					purge.push(id);
				}
			});
			purge.forEach(id=>{
				this.pending.delete(id);
			});
			dpc(1000, timeoutMonitor);
		}
		dpc(1000, timeoutMonitor);

	}

	close(){
		if(this.socket)
			this.socket.close();
	}

    
	on(op, callback) {
		this.events.on(op, callback);
	}


	initSocketHandlers() { return Promise.resolve(); }
}

