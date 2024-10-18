function addExternalScript(src, callback, attrs) {
    var script = document.createElement('script')
    script.setAttribute('src', src)

    if (attrs) {
        Object.keys(attrs).forEach(function (key) {
            script.setAttribute(key, attrs[key])
        })
    }

    script.onload = callback

    document.body.appendChild(script)
}

function loadCopyJs(snippets) {
    addExternalScript(
        'https://cdn.jsdelivr.net/npm/clipboard@2.0.8/dist/clipboard.min.js',
        function () {
            snippets.forEach(function (snippet) {
                var preEl = snippet.querySelector('pre')
                var codeEl = preEl.querySelector('code')
                preEl.insertAdjacentHTML(
                    'beforebegin',
                    "<div class='snippet-header'><span class='snippet-lang'>" +
                        codeEl.dataset.lang +
                        "</span><button class='copy-to-clipboard'>Copy</button></div>"
                )
            })

            var copyTimer, initialText
            var copiedText = 'Copied'

            var clipboard = new ClipboardJS('.copy-to-clipboard', {
                target: function (trigger) {
                    return trigger.parentElement.nextElementSibling
                },
            })

            clipboard.on('success', (e) => {
                var copyButton = e.trigger
                initialText = initialText || copyButton.textContent

                copyButton.textContent = copiedText

                clearTimeout(copyTimer)
                copyTimer = setTimeout(function () {
                    copyButton.textContent = initialText
                }, 1500)

                e.clearSelection()
            })
        },
        { defer: '' }
    )
}

function loadCopyHtml() {
    var snippets = document.querySelectorAll('.highlight')
    if (snippets.length) {
        loadCopyJs(snippets)
    }
}

function init() {
    loadCopyHtml()
}

init()