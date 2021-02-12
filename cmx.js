(function() {

	const config = {
		KEY_UP: 'KeyT',
		KEY_DOWN: 'KeyH',
		MAX_TABS: 15,
		SCROLL_OFF: 2
	};

	const data = `<div class="cmx-title"><img src="PATH"/>TITLE<div class="cmx-url">URL</div></div>`;

	let tabs = [];

	// Index of currently selected tab in the DOM unordered list
	let selected = 0;

	let displayed_tabs = 0;
	let last_selected = 0;
	let scroll = 0;
	let viewing = false;

	/*
	 * Inject modal into HTML and set the appropriate callbacks.
	 */
	fetch(chrome.extension.getURL('/modal.html'))
		.then(response => response.text())
		.then(function(data) {
			document.body.innerHTML += data;

			document.addEventListener('keydown', function(event) {
				if (event.code == 'KeyX' && (event.ctrlKey || event.metaKey)) {
					if (!viewing) {
						chrome.runtime.sendMessage({ text: 'get_tabs' }, function(t) {
							tabs = JSON.parse(t);
							open();
						});
					} else {
						close();
					}
				}
			});

			document.getElementById('cmx').addEventListener('keydown', function(event) {
				if (event.altKey) {
					switch (event.code) {
					case config.KEY_UP:
						cursor_up();
					break;
					case config.KEY_DOWN:
						cursor_down();
					break;
					}
				} else {
					switch (event.code) {
					case 'Escape':
						close();
						break;
					case 'Enter':
						const el = document.getElementsByClassName("cmx-selected")[0];
						move(parseInt(el.dataset.index));
						break;
					case 'ArrowUp':
						cursor_up();
						break;
					case 'ArrowDown':
						cursor_down();
						break;
					}
				}
			});

			document.getElementById('cmx').addEventListener('keyup', function(event) {
				if (event.code != 'ArrowUp' && event.code != 'ArrowDown'
						&& event.code != config.KEY_UP && event.code != config.KEY_DOWN) {
					update();
					update_selected();
				}
			});

		}).catch(console.log);

	/**
	 * Update displayed tabs.
	 */
	function update() {
		const text = document.getElementById('cmx-input').value;
		const ul = document.getElementById('cmx-ul');

		// Clear all previous children
		ul.innerHTML = '';

		var i = 0;
		displayed_tabs = 0;

		for (let tab of tabs) {
			// Skip if element should be scrolled off
			if (scroll > tab.index) {
				i++;
				continue;
			}

			// Break if we have enough elemnts
			if (i > config.MAX_TABS + scroll) {
				break;
			}

			// Skip if string doesn't match
			if (!text.toLowerCase().split(' ').every((t) => tab.title.includes(t) || tab.url.includes(t))) {
				continue;
			}

			var el = document.createElement("li");

			el.dataset.index = tab.index;

			el.addEventListener("click", function(event) {
				move(parseInt(event.target.parentNode.dataset.index));
			});

			var title = escape_dom(tab.title);
			var url = escape_dom(tab.url);

			text.split(' ').map(function(t) {
				title = title.replace(t, "<u>" + t + "</u>");
				url = url.replace(t, "<u>" + t + "</u>");
			})

			el.innerHTML = data.replace(/TITLE/g, title)
			                   .replace(/URL/g, url)
			                   .replace(/PATH/g, tab.favIconUrl ? tab.favIconUrl : "")

			ul.appendChild(el);

			i++;
			displayed_tabs++;
		}

		seleted = Math.max(displayed_tabs, selected);

		document.getElementById('cmx-ul').style.height = el.getBoundingClientRect().height * config.MAX_TABS + 'px';
		document.getElementById('cmx-count').innerHTML = '[' + displayed_tabs.toString() + '/' + tabs.length.toString() + ']';
	}

	function update_selected() {
		var nodes = document.getElementById('cmx-ul').children;
		nodes[last_selected].classList.remove("cmx-selected");
		nodes[selected].classList.add("cmx-selected");
		last_selected = selected;
	}

	function cursor_up() {
		if (scroll + 2 > config.SCROLL_OFF && selected < scroll_off + 1) {
			scroll--;
			update();
			update_selected();
		} else if (selected > 0) {
			selected--;
			update_selected();
		}
	}

	function cursor_down() {
		if (selected < displayed_tabs - 1) {
			if (selected + config.SCROLL_OFF > config.MAX_TABS - 2) {
				scroll++;
				update();
				update_selected();
			} else if (selected < displayed_tabs) {
				selected++;
				update_selected();
			}
		}
	}

	/**
	 * Switch to selected tab.
	 */
	function move(i) {
		chrome.runtime.sendMessage({
			text: 'switch_tab',
			index: i,
		}, null);
		close();
	}

	function open() {
		document.getElementById('cmx').style.display = "block";
		document.getElementById('cmx').style.visibility = "visible";
		document.getElementById('cmx-input').focus();
		viewing = true;
		update()
		update_selected();
	}

	function close() {
		viewing = false;
		document.getElementById("cmx").style.display = "none";
		document.getElementById("cmx").style.visibility = "hidden";
		document.getElementById('cmx-input').value = "";
	}

	/*
	 * Escape strings to be displayed in the DOM.
	 */
	function escape_dom(x) {
		return x.replace(/&/g, "&amp;")
		        .replace(/</g, "&lt;")
		        .replace(/>/g, "&gt;");
	}

})();
