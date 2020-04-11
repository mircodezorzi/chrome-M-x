// All tabs
var tabs_ = null;

// Index of currently selected tab in the DOM unordered list
var selected = 0;

// Index of currently selected tab
var selected_index = 0;

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
          function(tabs) {
            tabs_ = JSON.parse(tabs);
            document.getElementById('modal').style.display = "block";
            document.getElementById("modal-input").focus();
            viewing = true;
            update()
          });
      }
    });

    document.getElementById('modal').addEventListener('keydown', function(event) {
      switch (event.code) {
        case 'Escape':
          document.getElementById('modal').style.display = "none";
          document.getElementById('modal').value = "";
          break;
        case 'Enter':
          move();
          break;
        case 'ArrowUp':
          if (selected > 0)
            selected--;
          break;
        case 'ArrowDown':
          if (selected < tabs_.length)
            selected++;
          break;
      }
    });

    document.getElementById('modal').addEventListener('keyup', function(event) {
      if (viewing) {
        update();
      }
    });

  }).catch(err => {
    console.log(err);
  });

/**
 * Switch to selected tab.
 */
function move() {
  chrome.runtime.sendMessage({
    text: 'switch_tab',
    index: selected_index
  }, null);
  document.getElementById('modal').style.display = "none";
  document.getElementById('modal-input').value   = "";
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
  var text = document.getElementById('modal-input').value;
  var ul   = document.getElementById('modal-ul');

  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  var i = 0;
  for (tab of tabs_) {
    if (!tab.title.includes(text)) continue;
    var el = document.createElement("li");

    (function (x, y) {
      el.addEventListener("mousemove", function() {
        selected = y;
        selected_index = x;
        update();
      });
      el.addEventListener("click", function() {
        move();
      });
    })(i, tab.index);

    if (i == selected) {
      selected_index = tab.index;
      el.classList.add('selected');
    }
    el.innerHTML = escape_dom(tab.title);
    document.getElementById('modal-ul').appendChild(el);
    i++;
  }

}
