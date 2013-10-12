/*
 * lQuery v0.1
 * https://github.com/gucong3000/lQuery
 */
(function(){
	"use strict";
	var queryName = "lQuery",
		win = window,
		doc = win.document,
		root = doc.documentElement,
		addEventListener = doc.addEventListener,
		querySelector = doc.querySelector,
		randomNames = {},
		readyFns = [],
		readyFnOld;

	//对象初始化函数
	function lQuery(selector) {
		return new lQuery.fn.init(selector);
	}

	//返回文档状态是否就绪
	function isReady(){
		return doc.readyState == "complete";
	}

	//将callback在文档就绪时和节点插入时执行
	function readyEval(call){
		if(doc.body || !readyFns){
			//如果document.body可访问，说明文档已经开始渲染，尝试执行一次
			//如果队列不存在，表示文档就绪，直接执行
			call();
		}
		if (readyFns) {
			//如果文档就绪函数队列存在，表示文档未就绪，call放入队列
			readyFns.push(call);
		}
		if(addEventListener){
			//将call注册为节点插入事件响应函数
			addEventListener( "DOMNodeInserted", call );
		}
	}

	//执行文档就绪队列中的函数
	function completed(){
		if (readyFns) {
			for(var i = 0; i < readyFns.length; i++){
				readyFns[i]();
			}
			readyFns = null;
		}
	}

	//doc.addEventListener缩写
	if(addEventListener) {
		addEventListener = function(eType, call){
			doc.addEventListener( eType, call, false );
		}
	}

	//除IE6、7外，建立DOMContentLoaded响应机制
	if(querySelector && !isReady()){
		if ( addEventListener ) {
			addEventListener( "DOMContentLoaded", completed );
		} else {
			//
			var readyFnOld = doc.onreadystatechange;
			doc.onreadystatechange = function(){
				completed();
				if(readyFnOld){
					readyFnOld();
				}
			}
		}
	}

	//生成一个不重复的变量名
	lQuery.randomName = function(){
		var name = (function randomName(){
			name = queryName + (new Date() - 0) + parseInt(Math.random() * 0xfff);
			return randomNames[name] ? arguments.callee() : name;
		})();
		return randomNames[name] = name;
	};

	//声明lQuery对象的prototype
	lQuery.fn = {
		//初始化
		init: function(selector) {
			var me = this;
			me.selector = selector;
			//声明一个css样式表并插入页面当前位置
			root.lastChild.appendChild(me.styleNode = doc.createElement("style"));
			if(!addEventListener && querySelector){
				//IE8下不支持节点插入事件，用setInterval模拟
				me.timer = setInterval(function(){
					for(var i = 0; i < me.hooks.length; i++){
						me.hooks[i]();
					}
				}, 200);
			}
		},
		//写入css
		style: function(rule, css){
			if(!css){
				css = rule;
				rule = this.selector;
			}
			if(rule && this.styleNode.styleSheet){
				//担心IE低版遇到表达式中部分不识别导致整体失效，所以将规则拆分后写入
				rule = rule.split(/\s?,\s?/);
				for (var i = 0; i < rule.length; i++) {
					this.styleNode.styleSheet.addRule(rule[i], css);
				};
			} else {
				//一般浏览器下写入css
				this.styleNode.appendChild(doc.createTextNode(rule + "{" + css + "}"));
			}
			return this;
		},
		//异步遍历所选节点
		each: function(rule, callback){
			if(!callback){
				callback = rule;
				rule = this.selector;
			}
			var css = "filter:Alpha(Opacity=0);",
				randomName = lQuery.randomName(),
				index = 0,
				alpha,
				hook;
				
			//去重后带参执行回调，参数为节点对象
			function call(node){
				//过滤回调过的节点
				if(!node[randomName]){
					//标记为
					node[randomName] = true;
					callback.call(node, index++);
					//IE下关闭透明滤镜
					if(!addEventListener && (alpha = node.filters.Alpha)){
						alpha.Opacity === 0 && (alpha.Enabled = false);
					}
				}
			}
			if(querySelector){
				//其他浏览器下利用document.querySelectorAll查找
				readyEval(hook = function(){
					var nodes = doc.querySelectorAll(rule);
					for(var i = 0; i < nodes.length; i++){
						call(nodes[i]);
					}
				});
			} else {
				//IE6\7下利用css表达式查找节点
				css += randomName + ":expression((function(n){try{return " + queryName + "." + randomName + "(n)}catch(ex){}})(this))";
				lQuery[randomName] = call;
				hook = randomName;
			}
			this.hooks.push(hook);
			//IE6\7\8下写入css
			if(!addEventListener){
				this.style(rule, css);
			}
			return this;
		},
		//停止异步遍历节点
		die: function (){
			//删除初始化时插入的css样式表
			this.styleNode.parentNode.removeChild(this.styleNode);
			for(var i = 0; i < this.hooks.length; i++){
				var fn = this.hooks[i];
				if(addEventListener){
					//标准浏览器下删除DOMNodeInserted事件
					doc.removeEventListener( "DOMNodeInserted", fn, false );
				} else {
					//IE6\7删除hook函数
					delete lQuery[fn];
				}
			}
			//IE8删除定时器
			clearInterval(this.timer);
		},
		hooks: []
	}

	lQuery.fn.init.prototype = lQuery.fn;

	win[queryName] = lQuery;

})();