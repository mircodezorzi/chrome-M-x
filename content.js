let tabs = [];

let displayed_tabs = 0;

// Index of currently selected tab in the DOM unordered list
let selected = 0;
let last_selected = 0;

const max_tabs = 7;
const scroll_off = 2;

let scroll = 0;

// Index of currently selected tab
let selected_index = 0;

const data = `<div class="cmx-title"><img src="PATH"/>TITLE</div><div class="cmx-url">URL</div>`;

const config = {
	KEY_UP: 'KeyT',
	KEY_DOWN: 'KeyH',
}

/*
 * Inject modal into HTML and set the appropriate callbacks.
 */
fetch(chrome.extension.getURL('/modal.html'))
	.then(response => response.text())
	.then(function(data) {
		document.body.innerHTML += data;

		const cmx = document.getElementById('cmx');
		const cmx_input = document.getElementById('cmx-input');

		document.addEventListener('keydown', function(event) {
			if (event.code == 'KeyX' && (event.ctrlKey || event.metaKey)) {
				chrome.runtime.sendMessage({ text: 'get_tabs' },
					function(t) {
						tabs = JSON.parse(t);
						cmx.style.display = "block";
						cmx_input.focus();
						viewing = true;
						update()
						update_selected();
					});
			}
		});

		cmx.addEventListener('keydown', function(event) {
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
						cmx.style.display = "none";
						cmx.value = "";
						break;
					case 'Enter':
						move();
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

		cmx.addEventListener('keyup', function(event) {
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

	for (tab of tabs) {
		// Skip if element should be scrolled off
		if (scroll > tab.index) {
			i++;
			continue;
		}

		// Break if we have enough elemnts
		if (i > max_tabs + scroll) {
			break;
		}

		// Skip if string doesn't match
		if (!text.split(' ').every((t) => tab.title.includes(t) || tab.url.includes(t))) {
			continue;
		}

		var el = document.createElement("li");

		el.addEventListener("click", function() {
			move();
		});

		if (i == selected) {
			selected_index = tab.index;
			//el.classList.add('selected');
		}

		var title = escape_dom(tab.title);
		var url	 = escape_dom(tab.url);

		text.split(' ').map(function(t) {
			title = title.replace(t, "<u>" + t + "</u>");
			url	 = url.replace(t, "<u>" + t + "</u>");
		})

		el.innerHTML = data.replace(/TITLE/g, title)
											 .replace(/URL/g, url)
											 .replace(/PATH/g, tab.favIconUrl ? tab.favIconUrl : "")

		ul.appendChild(el);

		i++;
		displayed_tabs++;
	}

	document.getElementById('cmx-ul').style.height = el.getBoundingClientRect().height * max_tabs + 'px';
	document.getElementById('cmx-count').innerHTML = '[' + displayed_tabs.toString() + '/' + tabs.length.toString() + ']';
}

function update_selected() {
	var nodes = document.getElementById('cmx-ul').children;
	nodes[last_selected].classList.remove("selected");
	nodes[selected].classList.add("selected");
	last_selected = selected;
}

function cursor_up() {
	if (scroll + 2 > scroll_off && selected < scroll_off + 1) {
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
		if (selected + scroll_off > max_tabs - 2) {
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
function move() {
	chrome.runtime.sendMessage({
		text: 'switch_tab',
		index: selected_index
	}, null);
	document.getElementById('cmx').style.display = "none";
	document.getElementById('cmx-input').value	 = "";
}

/*
 * Escape strings to be displayed in the DOM.
 */
function escape_dom(x) {
	return x.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;");
}
