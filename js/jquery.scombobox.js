/**
 * jquery.simple-combobox v1.1.6 (2014-01-31): jQuery combobox plugin | (c) 2013 Ilya Kremer
 * MIT license http://www.opensource.org/licenses/mit-license.php
 */
 
// Fill free to use this jQuery plugin in any projects you want
// while keeping the comment above on top of the script.
// Don't forget not to remove it from a minimised version also.
// Thank you!

// TODO consider to use markup when filling combobox from original select options
// TODO consider to add fadeout background for items (checkboxes mode)
// TODO implement items removal (for infinite number of items)
/**
 * Core architecture taken from http://stackoverflow.com/a/6871820/837165
 * See and change default options at the end of the code.
 * This plugin uses following JS native methods:
 * String.prototype.trim()
 * Object.keys()
 * console methods
 * so don't forget to add them to your project for full browser compatibility.
 *
 * This plugin adds click listener on document, so don't forget to check if events
 * can rich it or use close method.
 * @param {Object} $ jQuery reference
 * @param {HTMLDocument} document
 * @returns {undefined}
 */
(function($, document) {
    var pname = 'scombobox'; // plugin name, don't forget to change css prefixes if necessary
    var cp = '.' + pname;
    var cdisplay = '-display', cvalue = '-value', cinvalid = '-invalid',
        cdiv = cdisplay + '-div', cditem = cdiv + '-item', cdiremove = cditem + '-remove', cdholder = cdiv + '-holder',
        clist = '-list', cmainspan = '-mainspan', chovered = '-hovered',
        csep = '-separator', cpheader = '-header',
        cddback = '-dropdown-background', cddarr = '-dropdown-arrow',
        cdisabled = '-disabled';
    var documentListenerAdded = false;
    function durations(d) {
        return ({
            fast: 200,
            normal: 400,
            slow: 600
        })[d] || d;
    }
    var pInt = parseInt;
    var methods = {
        /**
         * Initializes the combobox.
         * @returns {Object} jQuery object
         */
        init: function() {
            var $div = this.find('.' + pname + clist),
                $select = this.find('select'),
                $dropdownBack = this.find(cp + cddback),
                $dropdownArr = this.find(cp + cddarr);
            var opts = this.data(pname);
            this.addClass(pname);
            if ($select.length == 0) {
                this.append($('<select />'));
            }
            if (this.attr('id')) {
                $select.removeAttr('id');
            }
            if ($dropdownBack.length == 0) {
                this.append('<div class="' + pname + cddback + '" />');
            }
            if ($dropdownArr.length == 0) {
                this.append('<div class="' + pname + cddarr + '" />');
            }
            methods.displayDropdown.call(this, opts.showDropDown);
            if (opts.mode != 'checkboxes') {
                if (this.find(cp + cdisplay).length == 0) {
                    var $inputDisplay = $('<input class="' + pname + cdisplay + '" type="text" />');
                    this.append($inputDisplay);
                    this.height(
                        +$inputDisplay.css('font-size') +
                            +$inputDisplay.css('padding-top') +
                            +$inputDisplay.css('padding-bottom')
                    );
                }
            }
            if (opts.tabindex != null) {
                this.find(cp + cdisplay).attr('tabindex', opts.tabindex);
            }
            if (this.find(cp + cvalue).length == 0) {
                this.append('<input class="' + pname + cvalue + '" type="hidden" />');
            }
            if (this.find(cp + cdisplay).is(':disabled') || opts.disabled) {
                this.find(cp + cddback + ', ' + cp + cddarr).hide();
            }
            if (opts.disabled) {
                this.find(cp + cdisplay).prop('disabled', true);
                this.addClass(pname + cdisabled);
            }
            if ($div.length == 0) {
                this.append($div = $('<div class="' + pname + clist + '"></div>'));
            }
            if (opts.mode == 'checkboxes') {
                this.addClass(pname + '-checkboxes');
                this.find(cp + cdisplay).remove();
                var $displayDiv = $(cp + cdisplay + '-div');
                if ($displayDiv.length == 0) {
                    this.append('<div class="' + pname + cdiv +'"><div class="' + pname + cdholder + '" /></div>');
                }
                $div.insertAfter(this.find(cp + cdisplay + '-div'));
                var $dholder = this.find(cp + cdholder);
                var $testItem = $('<div class="' + pname + cditem + '" id="' + pname + '-test-item"><div class="' + pname + cditem + '-text">x</div></div>');
                $dholder.append($testItem.css('margin-left', '-9999px').show());
                var height = $testItem.height()
                    + pInt($testItem.css('padding-top')) * 2
                    + pInt($testItem.css('margin-top')) * 2
                    + pInt($testItem.css('border-top-width')) * 2
                    + pInt($dholder.css('padding-top')) * 2;
                this.find(cp + cdisplay + '-div').height(height);
                $testItem.remove();
            } else {
                this.find(cp + '-display-div').remove();
                $div.insertAfter(this.find(cp + cdisplay));
            }
            $div.css({'max-width': opts.listMaxWidth, 'max-height': opts.maxHeight});
            if (opts.wrap == true) {
                $div.css('white-space', 'normal');
            }
            if (opts.autoLoad != $.noop) {
                opts.loopScrolling = false; // there is no way to support this feature when auto loading more items
            }
            addListeners.call(this);
            this.data(pname + '-init', true); // true says that it is right after initialization, it is necessary for callback
            return methods.fill.call(this, opts.data); // (will be set to false after filling)
        },
        /**
         * Fills the combobox with specified data or using options list in select if no data given.
         * @see comments in defaults
         * @param {Array} data array of data objects. See comments in defaults
         * @param {Number} appendMode flag defining if to append (1) or prepend (2) data to existing items
         * @returns {Object} jQuery object
         */
        fill: function(data, appendMode) {
            var $options = this.find('select option');
            // don't ever rely on div content, always use select options instead
            var $div = this.find('.' + pname + clist), $select = this.find('select');
            data = normalizeData(data);
            var opts = this.data(pname);
            var mode = opts.mode;
            if (!data) { // no data were given; get data from select options
                if (opts.removeDuplicates) {
                    removeDupsjQ($options);
                    purifyOptions($options);
                    $options = this.find('select option'); // update after removal
                }
                if ($options.length == 0) {
                    // TODO restore, using $p.data(pname).key if provided instead
                } else { // here are options:
                    $options.each(function() {
                        var $t = $(this);
                        if ($t.hasClass(pname + csep)) { // separator, not an option
                            if ($t.hasClass(pname + cpheader)) { // if header text also given then add only header
                                $div.append($('<p class="' + pname + cpheader + '" />').text($t.text()));
                            } else { // else add separator itself
                                var $p = $('<p class="' + pname + csep + '" />');
                            }
                        } else {
                            $p = $('<p />').append($('<span class="' + pname + cmainspan + '" />').text($t.text())).data('value', this.value);
                            if (mode == 'checkboxes') {
                                $p.prepend('<input type="checkbox" />');
                            }
                        }
                        $div.append($p);
                    });
                }
            } else { // fill directly from given data
                if (opts.removeDuplicates) {
                    removeDups(data);
                }
                purifyData(data);
                if (opts.sort) {
                    data.sort(sortF);
                    if (!opts.sortAsc) {
                        data.reverse();
                    }
                }
                if (!appendMode) {
                    $select.empty();
                    $div.empty();
                    this.children(cp + cvalue + ', ' + cp + cdisplay).val('');
                }
                pFillFunc.call(this, data, appendMode == 2); // if appendMode == 2, then it is prepend
            }
            if (this.data(pname + '-init')) {
                opts.callback.func.apply(this, opts.callback.args);
                this.data(pname + '-init', false);
            }
            return this;
        },
        /**
         * Removes all items from combobox (html-based removal)
         * @returns {Object} jQuery object
         */
        clear: function() { // TODO check why to or not to remove data itself
            this.children('select').empty();
            this.children(cp + clist).empty().width('');
            this.children(cp + cdisplay).removeClass(pname + cinvalid);
            this.children(cp + cddback).removeClass(pname + cddback + cinvalid);
            return this;
        },
        /**
         * Updates data without touching html items or gets the data.
         * For updating combobox contents use fill method.
         * @param {string} data
         * @returns {Object} jQuery object
         */
        data: function(data) { // this method is required because after setting new options
            // via options method the data will be merged which probably will be wrong
            if (arguments.length == 0) {
                return this.data(pname).data;
            } else {
                this.data(pname).data = data;
            }
            return this;
        },
        /**
         * Enables and disables combobox.
         * @param {Boolean} b flag
         * @returns {Object|Boolean} jQuery object or boolean desabled status.
         */
        disabled: function(b) {
            var mode = this.data(pname).mode;
            if (arguments.length == 0) {
                if (mode == 'checkboxes') {
                    return this.hasClass(pname + cdisabled);
                } else { // default mode
                    return this.children(cp + cdisplay).prop('disabled');
                }
            }
            b = !!b;
            this.children(cp + cdisplay).prop('disabled', b);
            if (b) {
                this.addClass(pname + cdisabled);
                this.children(cp + cddback + ', ' + cp + cddarr).hide();
            } else {
                this.removeClass(pname + cdisabled);
                this.children(cp + cddback + ', ' + cp + cddarr).show();
            }
            return this;
        },
        /**
         * Sets the tabindex attribute for search input.
         * @param index
         * @returns {Number|Object}
         */
        tabindex: function(index) {
            var $display = this.find(cp + cdisplay);
            if (arguments.length == 0) {
                return $display.attr('tabindex');
            } else {
                $display.attr('tabindex', index);
                return this;
            }
        },
        /**
         * Resets options or see the options. Do not use this for changing data because merging is deep, so
         * data may be merged instead of being replaced.
         * For updating data use data method.
         * @param {Object} options
         * @returns {Object} jQuery object or options object
         */
        options: function(options) {
            if (arguments.length == 0) {
                return this.data(pname);
            }
            $.extend(true, this.data(pname), toCamelCase(options));
            return this;
        },
        /**
         * Combobox value setter and getter.
         * @param {String|Array} v value
         * @returns {Object|String|Array} jQuery object or string/array combobox current value.
         * Value returns as string in the default mode and as an array of values where items were
         * checked in checkboxes mode.
         * If combobox is disabled then empty string is returned.
         */
        val: function(v) {
            var mode = this.data(pname).mode;
            if (arguments.length == 0) { // get the value
                return mode == 'default' ?
                    (this.find(cp + cdisplay).is(':disabled') ? '' : this.find(cp + cvalue).val()) :
                    (mode == 'checkboxes' ? getValues.call(this) : null);
            } else { // set the value
                if (mode == 'default') {
                    setValue.call(this, v);
                } else if (mode == 'checkboxes') {
                    setValues.call(this, v);
                }
            }
            return this;
        },
        open: function() {
            slide.call(this.children(cp + clist), 'down');
            return this;
        },
        close: function() {
            slide.call(this.children(cp + clist), 'up');
            return this;
        },
        /*
         * Listeners.
         * Call $('#combo').combobox('keyup', null, 'namespace');
         * to trigger an event of specific namespace.
         */
        change: function(callback, namespace) {
            return bindOrTrig.call(this, 'change', this.children(cp + cvalue), callback, namespace);
        },
        focus: function(callback, namespace) {
            return bindOrTrig.call(this, 'focus', this.children(cp + cdisplay), callback, namespace);
        },
        blur: function(callback, namespace) {
            return bindOrTrig.call(this, 'blur', this.children(cp + cdisplay), callback, namespace);
        },
        keyup: function(callback, namespace) {
            return bindOrTrig.call(this, 'keyup', this.children(cp + cdisplay), callback, namespace);
        },
        keydown: function(callback, namespace) {
            return bindOrTrig.call(this, 'keydown', this.children(cp + cdisplay), callback, namespace);
        },
        keypress: function(callback, namespace) {
            return bindOrTrig.call(this, 'keypress', this.children(cp + cdisplay), callback, namespace);
        },
        click: function(callback, namespace) {
            return bindOrTrig.call(this, 'click', this.children(cp + cdisplay), callback, namespace);
        },
        mousedown: function(callback, namespace) {
            return bindOrTrig.call(this, 'mousedown', this.children(cp + cdisplay), callback, namespace);
        },
        clickDropdown: function(callback, namespace) {
            return bindOrTrig.call(this, 'click', this.children(cp + cddarr), callback, namespace);
        },
        /**
         * Checks if combobox current value is invalid or marks combobox value as invalid.
         * Marking combobox as invalid affects only on appearance.
         * @param {Boolean} b flag
         * @returns {Object|Boolean} jQuery object or boolean invalid status.
         */
        invalid: function(b) {
            if (arguments.length == 0) {
                this.children(cp + cdisplay).hasClass(pname + cinvalid);
            } else {
                this.children(cp + cdisplay).addClass(pname + cinvalid);
            }
            return this;
        },
        toSelect: function() {
            var $select = this.children('select').insertAfter(this);
            if (this.data(pname).reassignId) {
                $select.attr('id', this.attr('id'));
            }
            this.remove();
            return $select;
        },
        displayDropdown: function(b) {
            if (arguments.length) {
                if (!!b) {
                    this.children(cp + cddarr + ', ' + cp + cddback).show();
                } else {
                    this.children(cp + cddarr + ', ' + cp + cddback).hide();
                }
            } else {
                if (this.data(pname).showDropdown) {
                    this.children(cp + cddarr + ', ' + cp + cddback).show();
                } else {
                    this.children(cp + cddarr + ', ' + cp + cddback).hide();
                }
            }
            return this;
        }
    };

    function bindOrTrig(type, $element, callback, namespace) {
        if (typeof callback != 'function') { // trigger
            var action = type + (typeof callback == 'string' ? '.' + callback : (typeof namespace == 'string' ? '.' + namespace : ''));
            $element.trigger(action);
        } else { // bind
            addAdditionalListener.call($element, type, callback, namespace);
        }
        return this;
    }

    function addAdditionalListener(type, callback, namespace) {
        var action = type + (typeof namespace == 'string' ? '.' + namespace : '');
        this.bind(action, callback);
    }

    function getValues() { // for checkbox mode
        var values = [];
        var $paragraphs = this.find(cp + clist + ' p');
        for (var i = 0; i < $paragraphs.length; i++) {
            if ($($paragraphs[i]).find(':checkbox').is(':checked')) {
                values.push($($paragraphs[i]).data('value'));
            }
        }
        return values;
    }

    function setValues(values) { // for checkboxes mode
        var $paragraphs = $(this).find(cp + clist + ' p'), $vInput = $(this).children(cp + cvalue), arrV = '[';
        for (var i = 0; i < $paragraphs.length; i++) {
            var $p = $($paragraphs[i]), ind;
            if ((ind = values.indexOf($p.data('value'))) >= 0) {
                $p.find(':checkbox').prop('checked', true);
                arrV += values[ind] + ','
            }
        }
        $vInput.val(arrV.replace(/,\s+$/, '') + ']').change();
    }

    function setValue(value) { // for default mode
        var $t = $(this);
        var $select = $t.children('select'), $valueInput = $t.children(cp + cvalue), $display = $t.children(cp + cdisplay);
        var $selected = $select.children('[value="' + value + '"]');
        if ($selected.length == 0) { // no such value
            $select.children().prop('selected', false).first().prop('selected', true);
            if ($valueInput.val() != '') {
                $valueInput.val('').change();
            }
            $display.val('');
            return;
        }
        $select.val(value).change();
        $t.find(cp + cvalue).val(value);
    }

    /**
     * Add all the combobox logic.
     * @returns {undefined}
     */
    function addListeners() {
        if (this.data('listenersAdded')) { // prevent duplicating listeners
            return;
        }
        var $T = this, O = $T.data(pname);
        this.on('keyup', cp + cdisplay + ', ' + cp + cdiv, function(e) { // filter
            if ([13, 38, 40, 9].indexOf(e.which) >= 0) {
                return;
            }
            var fullMatch = O.fullMatch, highlight = O.highlight;
            if (fullMatch) {
                highlight = highlight !== false;
            } else {
                highlight = !!highlight;
            }
            var $t = $(this), search = this.value.toLowerCase().trim();
            var $div = $t.closest(cp).children(cp + clist);
            slide.call($div, 'down', true);
            var $options = $t.closest(cp).find('select option');
            $(cp + ' ' + cp + clist).each(function() {
                if ($div[0] != this) {
                    slide.call($(this), 'up');
                }
            });
            if (!search) {
                $div.children('p').show().each(function() {
                    $(cp + '-marker', this).contents().unwrap(); // remove selection
                });
                return;
            }
            $div.children('p').hide();
            $options.each(function() {
                var text = $(this).text().toLowerCase().trim();
                if (fullMatch ? text.indexOf(search) >= 0 : text.indexOf(search) == 0) {
                    // check index and show corresponding paragraph
                    var re = new RegExp(search, fullMatch ? 'g' : '');
                    var $ps = $div.children('p:eq(' + $options.index(this) + '):not(' + cp + csep + ', ' + cp + cpheader + ')').show();
                    if (highlight) {
                        $ps.each(function() {
                            $(cp + '-marker', this).contents().unwrap(); // remove previous selection
                            var mainSpan = $(cp + cmainspan, this)[0];
                            mainSpan.innerHTML = mainSpan.innerHTML.replace(re, '<span class="' + pname + '-marker">' + search + '</span>');
                        });
                    }
                }
            });
        });
        this.on('keydown', cp + cdisplay, function(e) {
            if ([38, 40, 13, 27, 9].indexOf(e.which) >= 0) {
                if (e.which != 9) {
                    e.preventDefault();
                }
                var $combobox = $(this).closest(cp);
                var $div = $combobox.children(cp + clist);
                var $hovered = $(cp + chovered, $div[0]), $curr, offset;
                var $first = $('p:first', $div[0]);
                var cycle = O.loopScrolling;
                var notHeaderSelector = ':not(' + cp + csep + ', ' + cp + cpheader + ')';
            } else {
                return;
            }
            var fillOnArrow = O.mode == 'default' ? O.fillOnArrowPress : false; // always false for checkboxes mode
            if ($div.is(':animated')) {
                return; // keydown event is only for arrows, enter and escape
            }
            var v = this.value.trim().toLowerCase();
            var scrollTop = $div.scrollTop();
            if (e.which == 40) { // arrdown
                if ($div.is(':hidden')) {
                    slide.call($div, 'down');
                    return;
                }
                if ($hovered.length == 0) {
                    if ($first.is(':visible' + notHeaderSelector)) {
                        $curr = $first.addClass(pname + chovered);
                    } else {
                        $curr = $first.nextAll(':visible' + notHeaderSelector).first().addClass(pname + chovered);
                    }
                } else {
                    if (!cycle) {
                        if (!$hovered.nextAll(':visible' + notHeaderSelector).first().length) {
                            return;
                        }
                    }
                    $curr = $hovered.removeClass(pname + chovered).nextAll(':visible' + notHeaderSelector).first().addClass(pname + chovered);
                    if ($curr.length == 0) {
                        if ($first.is(':visible')) {
                            $curr = $first.addClass(pname + chovered);
                        } else {
                            $curr = $first.nextAll(':visible' + notHeaderSelector).first().addClass(pname + chovered);
                        }
                    }
                    if ($curr.length == 0) {
                        $curr = $first;
                    }
                    offset = $curr.position().top - $div.position().top;
                    var currHeight = $curr.outerHeight();
                    if (offset + currHeight * 6 > $div.height()) { // keep 4 elements ahead
                        if ((offset + currHeight * 6) - $div.height() > currHeight * 1.5) { // $curr is under the visible bottom border
                            $div.scrollTop(scrollTop + offset);
                        } else { // no fix required
                            $div.scrollTop(scrollTop + currHeight); // incremental scrolltop
                        }
                    } else if (offset < 0) {
                        $div.scrollTop(scrollTop - -offset);
                    }
                }
                if (fillOnArrow) {
                    this.value = $curr.find(cp + cmainspan).text();
                    $combobox.children(cp + cdisplay).data('fillonarrow', true);
                }
            } else if (e.which == 38) { // arrup
                if ($div.is(':visible')) {
                    if (!cycle) {
                        if (!$hovered.prevAll(':visible' + notHeaderSelector).first().length) {
                            return;
                        }
                    }
                    $curr = $hovered.removeClass(pname + chovered).prevAll(':visible' + notHeaderSelector).first().addClass(pname + chovered);
                    if ($curr.length == 0) {
                        $curr = $('p:visible' + notHeaderSelector + ':last', $div[0]).addClass(pname + chovered);
                    }
                    offset = $curr.position().top - $div.position().top;
                    currHeight = $curr.outerHeight();
                    if (offset < currHeight * 3) {
                        $div.scrollTop(scrollTop - -offset - currHeight * 3);
                    } else if (offset > $div.height() - currHeight * 3) {
                        $div.scrollTop(scrollTop + offset - currHeight * 3); // to the last (was $div[0].scrollHeight)
                    }
                    if (fillOnArrow) {
                        this.value = $curr.find(cp + cmainspan).text();
                        $combobox.children(cp + cdisplay).data('fillonarrow', true);
                    }
                }
            } else if (e.which == 13) { // enter
                if (O.fillOnBlur) {
                    getFirstP($div).click();
                    return;
                }
                var valid = false;
                $div.children('p').each(function() {
                    if ($(cp + cmainspan, this).text().trim().toLowerCase() == v) {
                        $(this).click();
                        valid = true;
                    }
                });
                if (valid == false) {
                    $div.children(cp + chovered).click();
                }
                if (O.mode == 'default') {
                    slide.call($div, 'up');
                }
            } else if (e.which == 27) { // escape
                slide.call($(this).blur().closest(cp).children(cp + clist), 'up');
            } else if (e.which == 9) { // tab
                if (O.fillOnTab) {
                    if (v) {
                        var $p = $div.children('p:visible:first');
                        if ($p.length) {
                            e.preventDefault();
                            $div.children('p:visible:first').click();
                        }
                    }
                }
            }
        });
        this.on('change', 'select', function(e, checkboxesMode) { // someone triggered combobox select change
            var $combo = $(this).closest(cp);
            var dtext = $('option:selected', this).text();
            $combo.children(cp + cdisplay).val(dtext).data('value', dtext);
            var $valueInput = $combo.children(cp + cvalue);
            if ($valueInput.data('changed')) {
                $valueInput.data('changed', false);
                return;
            }
            $valueInput.change();
            if (checkboxesMode) { // no slideup for checkboxes mode
                return;
            }
            slide.call($combo.children(cp + clist), 'up');
        });
        this.on('click', cp + clist + ' p', function(e) { // value selected by clicking
            e.stopPropagation();
            if ($(this).is(cp + csep + ', ' + cp + cpheader)) {
                return;
            }
            clearTimeout($T.data(pname + '-invalid-timeout')); // undo checking for invalid
            $T.children(cp + cinvalid).removeClass(pname + cinvalid); // 100% it is not invalid now
            $T.children(cp + cddback).removeClass(pname + cddback + cinvalid);
            var $t = $(this), $div = $t.parent(), $ps = $div.children();
            var index = $ps.index(this);
            if ($T.data(pname).mode == 'checkboxes') {
                checkboxesModePClick.call(this, e); // process checking
                return;
            }
            var $select = $div.closest(cp).children('select');
            $select.children('option').eq(index).prop('selected', true);
            $select.siblings(cp + cvalue).val($select.val());
            $select.change();
            slide.call($t.parent(), 'up');
            $t.addClass(pname + chovered).siblings().removeClass(pname + chovered);
        });
        this.on('blur', cp + cdisplay, function() {
            var $t = $(this), O = $T.data(pname);
            if (O.fillOnBlur) {
                getFirstP($t.parent().children(cp + clist)).click();
                return;
            }
            var v = $t.val().trim().toLowerCase();
            var $select = $t.siblings('select');
            var $valueInput = $t.siblings(cp + cvalue);

            function checkForInvalid() {
                var value, v = $t.val().trim().toLowerCase();
                // check if such value exists in options
                $select.find('option').each(function () {
                    if (v == $(this).text().trim().toLowerCase()) {
                        value = this.value;
                    }
                });
                var invalid = (!value && v);
                if (invalid) {
                    if (O.forbidInvalid) {
                        $t.closest(cp).find(cp + cdisplay).val('').data('value', '');
                    } else {
                        $t.addClass(pname + cinvalid).siblings(cp + cddback)
                            .addClass(pname + cddback + cinvalid);
                    }
                    $t.siblings('select, ' + cp + cvalue).val('');
                } else {
                    $t.removeClass(pname + cinvalid).siblings(cp + cddback).removeClass(pname + cddback + cinvalid);
                }
            }
            // checking for invalid happens few moments later
            // invalid class will be removed when p gets click
            $T.data(pname + '-invalid-timeout', setTimeout(checkForInvalid, 500));
            var previousV = $valueInput.val();
            if (v == '') {
                $valueInput.val('');
            }
            if (previousV != $valueInput.val()) {
                $valueInput.change().data('changed', true);
            }
        });
        this.on('focus', cp + cdisplay, function() {
            if (!this.value.trim()) { // focusing in empty field
                // should trigger full dropdown:
                if ($T.data(pname).expandOnFocus) {
                    $(this).keyup();
                }
            } else { // input.display is not empty
                if ($T[pname]('val')) { // if value is valid // TODO consider does this code look good
                    var $listDiv = $T.children(cp + clist);
                    $listDiv.children().show();
                    slide.call($listDiv, 'down');
                }
            }
        });
        this.on('click', cp + cdisplay + '-div', function() {
            if ($T.data(pname).disabled) {
                return;
            }
            slide.call($(this).siblings(cp + clist), 'down');
        });
        this.on('click', cp + cdisplay, function(e) {
            e.stopPropagation();
        });
        this.on('click', cp + cddarr, function(e) {
            e.stopPropagation();
            var $t = $(this), $combo = $t.closest(cp);
            var $div = $combo.children(cp + clist);
            if ($div.is(':visible')) {
                slide.call($div, 'up');
            } else {
                slide.call($div, 'down');
                $combo.children(cp + cdisplay).focus();
            }
        });
        this.on('click', cp + cdiremove, function(e) {
            e.stopPropagation();
            var $t = $(this);
            var $item = $t.parent(), $div = $T.children(cp + clist);
            $div.children('p').eq($t.data('index')).find(':checkbox').prop('checked', false);
            $item.fadeOut(O.animation.duration);
            $t.closest(cp).children('select').trigger('change', [true]);
        });
        // scroll listener is for ajax loading
        if (O.autoLoad != $.noop) {
            $(cp + clist, this).scroll(function(e) {
                var $t = $(this), $select = $T.children('select');
                var currentScrollTop = $t.scrollTop();
                var overhead = 50;
                if (currentScrollTop > $t.data('scrollTop')) { // scrolling down
                    if (this.scrollHeight - currentScrollTop - overhead < $t.height()) {
                        if (!$T.data('pending')) {
                            $T.data('pending', true);
                            O.autoLoad.call($T, $select.find('option[value]:last').val(), 'bottom');
                        }
                    }
                } else { // scrolling up
                    if (currentScrollTop < $t.height() / 2) {
                        if (!$T.data('pending')) {
                            $T.data('pending', true);
                            O.autoLoad.call($T, $select.find('option[value]:first').val(), 'top');
                        }
                    }
                }
                $t.data('scrollTop', currentScrollTop);
            }).data('scrollTop', 0);
        }
        if (!documentListenerAdded) {
            documentListenerAdded = true;
            $(document).bind('click.' + pname, function() {
                slide.call($(cp + clist), 'up');
            });
        }
        this.data('listenersAdded', true);
    }

    /**
     * Converts given data to final form in the most convenient way.
     * @param {Array} data data given as options.data param
     * @returns {Array|Boolean} array of data objects or false if no data were given
     */
    function normalizeData(data) {
        if (typeof data == 'string') { // json given
            data = $.parseJSON(data);
            if (data == null) { // null == empty array
                return [];
            }
        }
        if (!data) { // all falsy except empty string
            return false;
        }
        if (!(data instanceof Array)) { // object (probably) was given, convert it to array
            if (typeof data != 'object') {
                return false;
            }
            if (typeof data.length == 'undefined') {
                data.length = Object.keys(data).length;
            }
            data = [].slice.call(data);
        }
        return data; // array was given
    }

    function purifyData(data, debug) {
        for (var i = 0; i < data.length; i++) {
            if ((!data[i].value || !data[i].text) && !(data[i].hasOwnProperty('separator'))) {
                data.splice(i, 1);
            }
        }
    }

    function purifyOptions($options) {
        for (var i = 0; i < $options.length; i++) {
            if (!$options[i].value && !$($options[i]).hasClass(pname + csep)) { // if no value,
                // but if it is a separator, then it is no matter if there is a not empty value
                $($options[i]).remove();
            }
        }
    }

    function sortF(a, b) {
        return a.text.trim().toLowerCase() > b.text.trim().toLowerCase() ? 1 : -1;
    }

    function removeDups(a) {
        for (var i = 0; i < a.length; i++) {
            for (var j = i + 1; j < a.length; j++) {
                if (!a[i] || !a[j])
                    continue;
                if (a[i].value == a[j].value)
                    a.splice(i, 1);
            }
        }
    }

    function removeDupsjQ(a) {
        for (var i = 0; i < a.length; i++) {
            for (var j = i + 1; j < a.length; j++) {
                if (!a[i] || !a[j])
                    continue;
                if (a[i].value == a[j].value) {
                    $(a[i]).remove();
                }
            }
        }
    }

    /**
     * Slides the div with list
     * @param dir 'up' = collapse, 'down' = expand.
     * @param backspace to fix backspace bug
     */
    function slide(dir, backspace) {
        if (this.is(':animated'))
            return;
        var options = this.parent().data(pname).animation;
        if (dir == 'up' && this.is(':hidden') && this.length == 1) {
            return;
        }
        if ($.easing[options.easing] == null) {
            console.warn('no such easing: ' + options.easing);
            options.easing = 'swing';
        }
        var $comboDiv = this.parent(), O = $comboDiv.data(pname);
        if (dir == 'up') {
            O.beforeClose.call($comboDiv);
            options.complete = function() {O.afterClose.call($comboDiv)};
            this.slideUp(options).data('p-clicked-index', -1);
            $comboDiv.children(cp + cddarr).removeClass(pname + cddarr + '-up');
        } else {
            O.beforeOpen.call($comboDiv);
            options.complete = function() {O.afterOpen.call($comboDiv)};
            this.slideDown(options);
            $comboDiv.children(cp + cddarr).addClass(pname + cddarr + '-up');
        }
        var $display = $comboDiv.children(cp + cdisplay); // code for fillOnArrowPress feature
        $display.each(function() {
            var $t = $(this);
            if ($t.data('fillonarrow') && !backspace) { // fix backspace bug
                $t.data('fillonarrow', false).val($t.data('value'));
            }
        });
    }

    function checkboxesModePClick(e) { // this refers to paragraph dom element
        var $t = $(this), $div = $t.parent(), $ps = $div.children('p'),
            index = $ps.index(this), duration = durations($div.parent().data(pname).animation.duration);
        var $chbox = $t.find(':checkbox');
        $chbox.prop('checked', !$chbox.prop('checked')); // avoid clicking, change prop instead
        var choice = $chbox.prop('checked');
        if (e.shiftKey) { // mark between last click and current
            if ($div.data('p-clicked-index') >= 0) { // not for the first time
                var f = $div.data('p-clicked-index');
                var from = f < index ? f : index, to = f < index ? index : f;
                for (var i = from; i <= to; i++) {
                    $($ps[i]).find(':checkbox').prop('checked', choice);
                }
            }
        }
        var $dispDivHolder = $(cp + cdholder).prepend('<span />');
        $(cp + cdholder).fadeOut(duration / 5, function() {
            $dispDivHolder.empty().show();
            // get all selected properties
            $ps.each(function(i) {
                var $t = $(this);
                if ($t.find(':checkbox').prop('checked')) {
                    $dispDivHolder.append(
                        $('<div />').addClass(pname + cditem)
                            .append($('<div />').addClass(pname + cditem + '-text').text($t.find(cp + cmainspan).text()))
                            .append($('<div />').addClass(pname + cdiremove).text('×').data('index', i)).fadeIn(duration * 1.5)
                    );
                }
            });
            $dispDivHolder.append('<div style="clear: both" />');
        });
        $div.data('p-clicked-index', index);
        $t.closest(cp).children('select').trigger('change', [true]); // do not slideup the items div
        $t.closest(cp).children(cp + cdisplay).focus(); // do not leave focus to keep escape key working as it should
    }

    function pFillFunc(data, prepend) {
        var settings = this.data(pname);
        var $select = this.find('select'), $div = this.find(cp + clist);
        for (var i = 0; i < data.length; i++) {
            if (data[i].hasOwnProperty('separator')) { // if separator given then
                if (data[i].hasOwnProperty('header')) { // if header text also given then add only header
                    $p = $('<p class="' + pname + cpheader + '" />').text(data[i].header);
                } else { // else add separator itself
                    var $p = $('<p class="' + pname + csep + '" />');
                }
                var $option = $('<option />');
            } else { // regular item
                $option = $('<option />').val(data[i].value).text(data[i].text);
                $p = settings.pFillFunc.call(this, data[i], settings);
            }
            if (prepend) {
                $select.prepend($option);
                $div.prepend($p);
            } else {
                $select.append($option);
                $div.append($p);
            }
        }
    }

    function getFirstP($clist) {
        var $closestP = $clist.children(cp + chovered + ':visible');
        if ($closestP.length == 0) {
            $closestP = $clist.children(':visible:first');
        }
        return $closestP;
    }

    function toCamelCase(o) {
        if (o == null) {
            return null;
        }
        var keys = Object.keys(o);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k].replace(/-([a-z])/g, function(g) { return g[1].toUpperCase() });
            if (keys[k] != key) { // hyphened property
                o[key] = o[keys[k]];
                delete o[keys[k]];
            }
            if (typeof o[key] == 'object' && key != 'data') {
                toCamelCase(o[key]);
            }
        }
        return o;
    }

    /**
     * The core.
     * @param {Object|String} actOrOpts action (string) or options (object)
     * @returns {Object|void} jQuery object on success. Throws error on undefined method.
     */
    $.fn[pname] = function(actOrOpts) {
        if (typeof actOrOpts == 'string') {
            if (this.length == 0) { // method called on empty collection
                return this;
            }
            var method = methods[actOrOpts];
            if (!methods[actOrOpts]) {
                $.error('No such method: ' + method + ' in jQuery.' + pname + '()');
            }
        } else if (typeof actOrOpts == 'object' || actOrOpts == null) {
            var options = $.extend(true, {}, $.fn[pname].defaults, toCamelCase(actOrOpts));
        } else {
            $.error('Incorrect usage');
            return this;
        }
        if (method) {
            return method.apply(this, Array.prototype.slice.call(arguments, 1));
        }
        return this.each(function() {
            var $t = $(this);
            if (!($t.is('select, div'))) {
                console.warn('target element is incorrect: ', this);
                return;
            }
            if ($t.is('select')) {
                $t.wrap('<div />');
                if (options.reassignId) {
                    $t.parent().attr('id', $t.attr('id'));
                }
                $t = $t.parent();
            }
            $t.data(pname, $.extend(true, {}, options)); // cloning object is required for cases like:
            // $('multiple targets selector').combobox(settings)
            // $('one of a bunch').combobox('options', propertiesToChange)
            // If the options object is not cloned above,
            // then changing properties will affect every target in the original set.
            methods.init.apply($t);
        });
    };

    $.fn[pname].defaults = {
        /**
         * If no data given combobox is filled relying on $('select option') list.
         * By default (see pMarkup and pFillFunc) the data is an array of objects:
         * {value: '', text: '', additional: '', imgsrc: ''}
         * You can also provide json or object with enumerated properties:
         * {0: {...}, 1: {...}, ...}
         */
        data: null,
        /**
         * Whether set combobox disabled.
         */
        disabled: false,
        /**
         * Whether to sort options alphabetically or not
         */
        sort: true,
        /**
         * false to sort descending
         */
        sortAsc: true,
        /**
         * Whether to remove duplicates (regarding to values only).
         * Not removing duplicated may cause an error, so be careful
         */
        removeDuplicates: true,
        /**
         * Whether to match in any part of the option text or only start from the beginning of the text
         */
        fullMatch: false,
        /**
         * By default highlighting is turned on when fullMatch is turned on.
         * Set it strictly to false to disable it anyway or to any truthy value to set it always enabled
         */
        highlight: null,
        /**
         * When false options list does not drop down on focus.
         * In this case you have to click on arrow to expand the list.
         */
        expandOnFocus: true,
        /**
         * Set tabindex
         */
        tabindex: null,
        /**
         * When true, invalid values are forbidden what means combobox search input empties on blur in case the value
         * was not chosen and search field contained wrong text.
         * When false, incorrect filled combobox search field will has invalid css class.
         */
        forbidInvalid: false,
        /**
         * If true id from select will be reassigned to the created combobox div when query target was select, like $('select').combobox()
         */
        reassignId: true,
        /**
         * Combobox mode 'default' means it is looking like select box with input for searching.
         * mode 'checkboxes' means every option has a checkbox. In checkboxes mode the value of
         * combobox is an array of values which were checked.
         */
        mode: 'default',
        /**
         * Don't forget to change pFillFunc if necessary when you change the markup.
         * Img hides if no imgsrc given by default (see pFillFunc)
         * <span class="mainspan"></span> is required to use marker highlighting while typing. Highlighting is only working for the text
         * in this span. That means filter does not apply to additional text. See data parameter.
         */
        pMarkup: '<img src="${imgsrc}" /><span class="' + pname + cmainspan + '">${text}</span> <span>${additional}</span>',
        /**
         * Change replacements lines in this function if necessary after changing pMarkup
         * this refers to combobox
         * @param item {Object} item from data array
         * @param options {Object} plugin instance properties
         */
        pFillFunc: function(item, options) {
            var $p = $('<p />').html(options.pMarkup
                .replace('${text}', item.text)
                .replace('${additional}', item.additional ? item.additional : '')
                .replace('${imgsrc}', item.imgsrc || '')
            );
            if (typeof item.imgsrc != 'string') {
                $p.find('img').hide();
            }
            return $p;
        },
        /**
         * Animation settings.
         */
        animation: {
            duration: 'fast', // animation speed
            easing: 'swing' // easing effect
        },
        /**
         * Dropdown div max width
         */
        listMaxWidth: window.screen.width / 2,
        /**
         * Use this to handle long text options lists.
         * If true then long text options will take multiple lines. If false, then horizontal slider appears in list.
         */
        wrap: true,
        /**
         * Items list div maximum height (css property)
         */
        maxHeight: '',
        /**
         * Put main text in input while walking though the options with arrow keys
         */
        fillOnArrowPress: true,
        /**
         * Select hovered or first matching option on blur
         */
        fillOnBlur: false,
        /**
         * Whether to set the first visible item as a value on tab key press (works only if search input is not empty).
         * If set to false then the default action is working (going to the next input on page).
         */
        fillOnTab: true,
        /**
         * If set to true dropdown arrow appears in the right corner of combobox
         */
        showDropDown: true,
        /**
         * Callback executes after finishing initialization.
         */
        callback: {
            func: $.noop, // this refers to combobox's div holder
            args: [] // arguments
        },
        beforeOpen: $.noop,
        beforeClose: $.noop,
        afterOpen: $.noop,
        afterClose: $.noop,
        /**
         * This option is for ajax loading (appending/prepending items). This function usage is:
         * function(value, direction) {
         *     // value here is the edge value in the list (last for appending or first for prepending).
         *     // direction here is the scrolling direction, which can be either 'top' or 'bottom'
         *     // so you can do something like this:
         *     var $t = this;
         *     $.post('your url here' + (direction == 'top' ? '?prepend' : ''), {id: value}, function(res) {
         *         $t.scombobox('fill', res, direction == 'top' ? 2 : 1); // 1 for prepending, 2 for appending
         *         $t.data('pending', false); // this line is compulsory
         *     }, 'json');
         * }
         */
        autoLoad: $.noop,
        /**
         * Enables infinite scrolling for up and down arrows keys.
         * When autoLoad function provided then loopScrolling is set to false.
         */
        loopScrolling: true
    };

    /**
     * This function lets you override the default params without touching original plugin code.
     * Usage: $.scombobox.extendDefaults(yourDefaults);
     * @param options {Object} your custom defaults.
     */
    $.fn[pname].extendDefaults = function(options) {
        $.extend(true, $.fn[pname].defaults, options);
    };
})(jQuery, document);
