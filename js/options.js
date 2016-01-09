chrome.runtime.sendMessage({command: 'getOptions'}, function(response) {
  var options = {};
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  Array.prototype.forEach.call(checkboxes, function(checkbox) {
    var id = checkbox.id;
    checkbox.checked = options[id] = !!response[id];
    checkbox.addEventListener('change', function() {
      options[id] = !!checkbox.checked;
      chrome.runtime.sendMessage({command: 'setOptions', payload: options});
    });
  });
});
