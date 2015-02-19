// Anton Ignatov, w-art
if (window.console == null) {
	window.console = {};
	console.log = console.info = console.warn = console.debug = console.group = console.groupEnd = console.error = console.time = console.timeEnd = function() {};
}

window.WebApp || (window.WebApp = {});

window.WebApp.Observatory = function() {
	var regex = /\s+/,
		contexts = [],
		handlers = [],
		eventMap = {},
		mutedNamesMap = {},
		mutedHandlerMap = {};

	this.on = function(eventName, handler, context) {
		var handlerId = handlers.length,
			name,
			event,
			events,
			namespace,
			delimiterIndex;

		if (!eventName || !handler || typeof(handler) !== 'function') {
			console.error('No event name or handler! Skipping...');
			return this;
		}

		if (eventName.indexOf(' ') >= 0) {
			events = eventName.split(regex);
		} else {
			events = [eventName];
		}

		// Добавляем обработчик в коллекцию обработчиков
		handlers.push(handler);

		// Добавляем контекст в коллекцию контекстов
		contexts.push(context);

		for (;events.length;) {
			name = null;
			namespace = null;
			event = events.shift();
			delimiterIndex = event.lastIndexOf('.');

			if (delimiterIndex >= 0) {
				name = event.substring(0, delimiterIndex);
				namespace = event.substring(delimiterIndex);
			} else {
				name = event;
			}

			if (name && namespace) {
				if (!eventMap[event]) {
					eventMap[event] = [];
				}
				eventMap[event].push(handlerId);
			}

			if (namespace) {
				if (!eventMap[namespace]) {
					eventMap[namespace] = [];
				}
				eventMap[namespace].push(handlerId);
			}

			if (name) {
				if (!eventMap[name]) {
					eventMap[name] = [];
				}
				eventMap[name].push(handlerId);
			}

			// Проверяем небыло ли "заглушено" событие.
			// Если да, то делаем заглушение текущего обработчика.
			if (mutedNamesMap[event] || mutedNamesMap[name] || mutedNamesMap[namespace]) {
				mutedHandlerMap[handlerId] = handlers[handlerId];
				handlers[handlerId] = null;
			}
		}
		return this;
	};

	this.off = function(eventName, handler, context) {
		var name,
			event,
			events,
			handlerId;

		if (eventName.indexOf(' ') >= 0) {
			events = eventName.split(regex);
		} else {
			events = [eventName];
		}

		for (;events.length;) {
			name = events.shift();
			event = eventMap[name];

			if (!event) {return;}

			for (var i = 0, length = event.length; i < length; i++) {
				handlerId = event[i];

				if (handlers[handlerId]) {
					if (!handler || handler == handlers[handlerId]) {
						if (!context || contexts[handlerId] == context) {
							// Удаляем обработчик и контекст
							handlers[handlerId] = contexts[handlerId] = null;
						}
					}
				}
			}
		}
		return this;
	};

	this.trigger = function(eventName, params) {
		var events,
			handler,
			handlerId;

		if (!eventName) {
			console.error('No event name! Skipping...');
			return this;
		}

		if (eventName.indexOf(' ') >= 0) {
			eventName = eventName.replace(' ', '');
		}
		events = eventMap[eventName];

		if (events) {
			for (var i = 0, length = events.length; i < length; i++) {
				handlerId = events[i];
				handler = handlers[handlerId];

				if (handler) {
					// Пытаемся вызвать обработчик событий с подготовленными аргументами
					try {
						// Проверяем если аргумент `params` это массив, то выполняем более сложную и медленную
						// операцию вызова обработчика события.
						// Если же `params` не определен или не является массивом, то выполняем быстрый вызов
						// обработчика.
						if (typeof(params) === 'object' && typeof(params.concat) === 'function' && typeof(params.length) === 'number' && params.length) {
							handler.apply(contexts[handlerId], [eventName].concat(params));
						} else {
							handler.call(contexts[handlerId], eventName, params);
						}
					} catch(e) {
						// Если вызов прошел не успешно выдаем в консоль ошибку и продолжаем дальше
						console.error(e);
					}
				}
			}
		}
		return this;
	};

	this.mute = function(eventName) {
		var name,
			event,
			events,
			handlerId;

		if (!eventName) {
			console.error('No event name! Skipping...');
			return this;
		}

		if (eventName.indexOf(' ') >= 0) {
			events = eventName.split(regex);
		} else {
			events = [eventName];
		}

		for (;events.length;) {
			name = events.shift();

			if (!mutedNamesMap[name]) {
				mutedNamesMap[name] = 1;
				event = eventMap[name];

				if (!event) {return;}

				for (var i = 0, length = event.length; i < length; i++) {
					handlerId = event[i];

					if (!mutedHandlerMap[handlerId]) {
						mutedHandlerMap[handlerId] = handlers[handlerId];
						handlers[handlerId] = null;
					}
				}
			}
		}
		return this;
	};

	this.unmute = function(eventName) {
		var name,
			event,
			events,
			handlerId;

		if (!eventName) {
			console.error('No event name! Skipping...');
			return this;
		}

		if (eventName.indexOf(' ') >= 0) {
			events = eventName.split(regex);
		} else {
			events = [eventName];
		}

		for (;events.length;) {
			name = events.shift();
			event = eventMap[name];

			if (!event) {return;}

			for (var i = 0, length = event.length; i < length; i++) {
				handlerId = event[i];

				if (mutedHandlerMap[handlerId]) {
					handlers[handlerId] = mutedHandlerMap[handlerId];
					delete mutedHandlerMap[handlerId];
				}
			}
		}
		return this;
	};
};
