var tabs = null;
var displayed_tabs = 0;

// Index of currently selected tab in the DOM unordered list
var selected = 0;

// Index of currently selected tab
var selected_index = 0;

const data = `<div class="dswitch-title"><img src="PATH"/>TITLE</div><div class="dswitch-url">URL</div>`;

const config = {
  KEY_UP:   'KeyT',
  KEY_DOWN: 'KeyH',
}

/*
 * Inject modal into HTML and set the appropriate callbacks.
 */
fetch(chrome.extension.getURL('/modal.html'))
  .then(response => response.text())
  .then(data => {
    document.body.innerHTML += data;

    document.addEventListener('keydown', function(event) {
      if (event.code == 'KeyM' && (event.ctrlKey || event.metaKey)) {
        chrome.runtime.sendMessage({ text: 'get_tabs' },
          function(tabs_) {
            tabs = JSON.parse(tabs_);
            document.getElementById('dswitch').style.display = "block";
            document.getElementById("dswitch-input").focus();
            viewing = true;
            update()
          });
      }
    });

    document.getElementById('dswitch').addEventListener('keydown', function(event) {
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
            document.getElementById('dswitch').style.display = "none";
            document.getElementById('dswitch').value = "";
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

    document.getElementById('dswitch').addEventListener('keyup', function(event) {
      if (event.code != 'ArrowUp' && event.code != 'ArrowDown') {
        update();
      }
    });

  }).catch(err => {
    console.log(err);
  });


function cursor_up() {
  if (selected > 0) {
    selected--;
  }
  var nodes = document.getElementById('dswitch-ul').children;
  nodes[selected + 1].classList.remove("selected");
  nodes[selected].classList.add("selected");
}

function cursor_down() {
  if (selected < displayed_tabs) {
    selected++;
  }
  var nodes = document.getElementById('dswitch-ul').children;
  nodes[selected - 1].classList.remove("selected");
  nodes[selected].classList.add("selected");
}

/**
 * Switch to selected tab.
 */
function move() {
  chrome.runtime.sendMessage({
    text: 'switch_tab',
    index: selected_index
  }, null);
  document.getElementById('dswitch').style.display = "none";
  document.getElementById('dswitch-input').value   = "";
}

/*
 * Escape strings to be displayed in the DOM.
 */
function escape_dom(x) {
  return x.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
}

/**
 * Update displayed tabs.
 */
function update() {
  var text = document.getElementById('dswitch-input').value;
  var ul   = document.getElementById('dswitch-ul');

  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  var i   = 0;

  for (tab of tabs) {

    if (!text.split(' ').every((t) => tab.title.includes(t) || tab.url.includes(t))) {
      continue;
    }

    displayed_tabs++;

    var el = document.createElement("li");

    (function (pos, index, el) {
      el.addEventListener("mouseenter", function() {
        selected = pos;
        selected_index = index;
        el.classList.add('selected');
      });
      el.addEventListener("mouseleave", function() {
        el.classList.remove('selected');
      });
      el.addEventListener("click", function() {
        move();
      });
    })(i, tab.index, el);

    if (i == selected) {
      selected_index = tab.index;
      el.classList.add('selected');
    }

    var title = escape_dom(tab.title);
    var url   = escape_dom(tab.url);

    text.split(' ').map((t) => {
      title = title.replace(t, "<u>" + t + "</u>");
      url   = url.replace(t, "<u>" + t + "</u>");
    })

    el.innerHTML = data.replace(/TITLE/g, title)
                       .replace(/URL/g, url)
                       .replace(/PATH/g, tab.favIconUrl ? tab.favIconUrl : "")

    ul.appendChild(el);

    i++;

  }

}
