/**
 * jquery.mask.js
 * @version: v1.14.16
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at github.com/igorescobar/jQuery-Mask-Plugin
 *
 * Copyright (c) 2012 Igor Escobar http://igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* jshint laxbreak: true */
/* jshint maxcomplexity:17 */
/* global define */

// UMD (Universal Module Definition) patterns for JavaScript modules that work everywhere.
// https://github.com/umdjs/umd/blob/master/templates/jqueryPlugin.js
(function (factory, jQuery, Zepto) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object' && typeof Meteor === 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery || Zepto);
    }

}(function ($) {
    'use strict';

    var Mask = function (el, mask, options) {

        var p = {
            invalid: [],
            getCaret: function () {
                try {
                    var sel,
                        pos = 0,
                        ctrl = el.get(0),
                        dSel = document.selection,
                        cSelStart = ctrl.selectionStart;

                    // IE Support
                    if (dSel && navigator.appVersion.indexOf('MSIE 10') === -1) {
                        sel = dSel.createRange();
                        sel.moveStart('character', -p.val().length);
                        pos = sel.text.length;
                    }
                    // Firefox support
                    else if (cSelStart || cSelStart === '0') {
                        pos = cSelStart;
                    }

                    return pos;
                } catch (e) {}
            },
            setCaret: function(pos) {
                try {
                    if (el.is(':focus')) {
                        var range, ctrl = el.get(0);

                        // Firefox, WebKit, etc..
                        if (ctrl.setSelectionRange) {
                            ctrl.setSelectionRange(pos, pos);
                        } else { // IE
                            range = ctrl.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', pos);
                            range.moveStart('character', pos);
                            range.select();
                        }
                    }
                } catch (e) {}
            },
            events: function() {
                el
                .on('keydown.mask', function(e) {
                    el.data('mask-keycode', e.keyCode || e.which);
                    el.data('mask-previus-value', el.val());
                    el.data('mask-previus-caret-pos', p.getCaret());
                    p.maskDigitPosMapOld = p.maskDigitPosMap;
                })
                .on($.jMaskGlobals.useInput ? 'input.mask' : 'keyup.mask', p.behaviour)
                .on('paste.mask drop.mask', function() {
                    setTimeout(function() {
                        el.keydown().keyup();
                    }, 100);
                })
                .on('change.mask', function(){
                    el.data('changed', true);
                })
                .on('blur.mask', function(){
                    if (oldValue !== p.val() && !el.data('changed')) {
                        el.trigger('change');
                    }
                    el.data('changed', false);
                })
                // it's very important that this callback remains in this position
                // otherwhise oldValue it's going to work buggy
                .on('blur.mask', function() {
                    oldValue = p.val();
                })
                // select all text on focus
                .on('focus.mask', function (e) {
                    if (options.selectOnFocus === true) {
                        $(e.target).select();
                    }
                })
                // clear the value if it not complete the mask
                .on('focusout.mask', function() {
                    if (options.clearIfNotMatch && !regexMask.test(p.val())) {
                       p.val('');
                   }
                });
            },
            getRegexMask: function() {
                var maskChunks = [], translation, pattern, optional, recursive, oRecursive, r;

                for (var i = 0; i < mask.length; i++) {
                    translation = jMask.translation[mask.charAt(i)];

                    if (translation) {

                        pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, '');
                        optional = translation.optional;
                        recursive = translation.recursive;

                        if (recursive) {
                            maskChunks.push(mask.charAt(i));
                            oRecursive = {digit: mask.charAt(i), pattern: pattern};
                        } else {
                            maskChunks.push(!optional && !recursive ? pattern : (pattern + '?'));
                        }

                    } else {
                        maskChunks.push(mask.charAt(i).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                    }
                }

                r = maskChunks.join('');

                if (oRecursive) {
                    r = r.replace(new RegExp('(' + oRecursive.digit + '(.*' + oRecursive.digit + ')?)'), '($1)?')
                         .replace(new RegExp(oRecursive.digit, 'g'), oRecursive.pattern);
                }

                return new RegExp(r);
            },
            destroyEvents: function() {
                el.off(['input', 'keydown', 'keyup', 'paste', 'drop', 'blur', 'focusout', ''].join('.mask '));
            },
            val: function(v) {
                var isInput = el.is('input'),
                    method = isInput ? 'val' : 'text',
                    r;

                if (arguments.length > 0) {
                    if (el[method]() !== v) {
                        el[method](v);
                    }
                    r = el;
                } else {
                    r = el[method]();
                }

                return r;
            },
            calculateCaretPosition: function(oldVal) {
                var newVal = p.getMasked(),
                    caretPosNew = p.getCaret();
                if (oldVal !== newVal) {
                    var caretPosOld = el.data('mask-previus-caret-pos') || 0,
                        newValL = newVal.length,
                        oldValL = oldVal.length,
                        maskDigitsBeforeCaret = 0,
                        maskDigitsAfterCaret = 0,
                        maskDigitsBeforeCaretAll = 0,
                        maskDigitsBeforeCaretAllOld = 0,
                        i = 0;

                    for (i = caretPosNew; i < newValL; i++) {
                        if (!p.maskDigitPosMap[i]) {
                            break;
                        }
                        maskDigitsAfterCaret++;
                    }

                    for (i = caretPosNew - 1; i >= 0; i--) {
                        if (!p.maskDigitPosMap[i]) {
                            break;
                        }
                        maskDigitsBeforeCaret++;
                    }

                    for (i = caretPosNew - 1; i >= 0; i--) {
                        if (p.maskDigitPosMap[i]) {
                            maskDigitsBeforeCaretAll++;
                        }
                    }

                    for (i = caretPosOld - 1; i >= 0; i--) {
                        if (p.maskDigitPosMapOld[i]) {
                            maskDigitsBeforeCaretAllOld++;
                        }
                    }

                    // if the cursor is at the end keep it there
                    if (caretPosNew > oldValL) {
                      caretPosNew = newValL * 10;
                    } else if (caretPosOld >= caretPosNew && caretPosOld !== oldValL) {
                        if (!p.maskDigitPosMapOld[caretPosNew])  {
                          var caretPos = caretPosNew;
                          caretPosNew -= maskDigitsBeforeCaretAllOld - maskDigitsBeforeCaretAll;
                          caretPosNew -= maskDigitsBeforeCaret;
                          if (p.maskDigitPosMap[caretPosNew])  {
                            caretPosNew = caretPos;
                          }
                        }
                    }
                    else if (caretPosNew > caretPosOld) {
                        caretPosNew += maskDigitsBeforeCaretAll - maskDigitsBeforeCaretAllOld;
                        caretPosNew += maskDigitsAfterCaret;
                    }
                }
                return caretPosNew;
            },
            behaviour: function(e) {
                e = e || window.event;
                p.invalid = [];

                var keyCode = el.data('mask-keycode');

                if ($.inArray(keyCode, jMask.byPassKeys) === -1) {
                    var newVal = p.getMasked(),
                        caretPos = p.getCaret(),
                        oldVal = el.data('mask-previus-value') || '';

                    // this is a compensation to devices/browsers that don't compensate
                    // caret positioning the right way
                    setTimeout(function() {
                      p.setCaret(p.calculateCaretPosition(oldVal));
                    }, $.jMaskGlobals.keyStrokeCompensation);

                    p.val(newVal);
                    p.setCaret(caretPos);
                    return p.callbacks(e);
                }
            },
            getMasked: function(skipMaskChars, val) {
                var buf = [],
                    value = val === undefined ? p.val() : val + '',
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = 'push',
                    resetPos = -1,
                    maskDigitCount = 0,
                    maskDigitPosArr = [],
                    lastMaskChar,
                    check;

                if (options.reverse) {
                    addMethod = 'unshift';
                    offset = -1;
                    lastMaskChar = 0;
                    m = maskLen - 1;
                    v = valLen - 1;
                    check = function () {
                        return m > -1 && v > -1;
                    };
                } else {
                    lastMaskChar = maskLen - 1;
                    check = function () {
                        return m < maskLen && v < valLen;
                    };
                }

                var lastUntranslatedMaskChar;
                while (check()) {
                    var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];

                    if (translation) {
                        if (valDigit.match(translation.pattern)) {
                            buf[addMethod](valDigit);
                             if (translation.recursive) {
                                if (resetPos === -1) {
                                    resetPos = m;
                                } else if (m === lastMaskChar && m !== resetPos) {
                                    m = resetPos - offset;
                                }

                                if (lastMaskChar === resetPos) {
                                    m -= offset;
                                }
                            }
                            m += offset;
                        } else if (valDigit === lastUntranslatedMaskChar) {
                            // matched the last untranslated (raw) mask character that we encountered
                            // likely an insert offset the mask character from the last entry; fall
                            // through and only increment v
                            maskDigitCount--;
                            lastUntranslatedMaskChar = undefined;
                        } else if (translation.optional) {
                            m += offset;
                            v -= offset;
                        } else if (translation.fallback) {
                            buf[addMethod](translation.fallback);
                            m += offset;
                            v -= offset;
                        } else {
                          p.invalid.push({p: v, v: valDigit, e: translation.pattern});
                        }
                        v += offset;
                    } else {
                        if (!skipMaskChars) {
                            buf[addMethod](maskDigit);
                        }

                        if (valDigit === maskDigit) {
                            maskDigitPosArr.push(v);
                            v += offset;
                        } else {
                            lastUntranslatedMaskChar = maskDigit;
                            maskDigitPosArr.push(v + maskDigitCount);
                            maskDigitCount++;
                        }

                        m += offset;
                    }
                }

                var lastMaskCharDigit = mask.charAt(lastMaskChar);
                if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
                    buf.push(lastMaskCharDigit);
                }

                var newVal = buf.join('');
                p.mapMaskdigitPositions(newVal, maskDigitPosArr, valLen);
                return newVal;
            },
            mapMaskdigitPositions: function(newVal, maskDigitPosArr, valLen) {
              var maskDiff = options.reverse ? newVal.length - valLen : 0;
              p.maskDigitPosMap = {};
              for (var i = 0; i < maskDigitPosArr.length; i++) {
                p.maskDigitPosMap[maskDigitPosArr[i] + maskDiff] = 1;
              }
            },
            callbacks: function (e) {
                var val = p.val(),
                    changed = val !== oldValue,
                    defaultArgs = [val, e, el, options],
                    callback = function(name, criteria, args) {
                        if (typeof options[name] === 'function' && criteria) {
                            options[name].apply(this, args);
                        }
                    };

                callback('onChange', changed === true, defaultArgs);
                callback('onKeyPress', changed === true, defaultArgs);
                callback('onComplete', val.length === mask.length, defaultArgs);
                callback('onInvalid', p.invalid.length > 0, [val, e, el, p.invalid, options]);
            }
        };

        el = $(el);
        var jMask = this, oldValue = p.val(), regexMask;

        mask = typeof mask === 'function' ? mask(p.val(), undefined, el,  options) : mask;

        // public methods
        jMask.mask = mask;
        jMask.options = options;
        jMask.remove = function() {
            var caret = p.getCaret();
            if (jMask.options.placeholder) {
                el.removeAttr('placeholder');
            }
            if (el.data('mask-maxlength')) {
                el.removeAttr('maxlength');
            }
            p.destroyEvents();
            p.val(jMask.getCleanVal());
            p.setCaret(caret);
            return el;
        };

        // get value without mask
        jMask.getCleanVal = function() {
           return p.getMasked(true);
        };

        // get masked value without the value being in the input or element
        jMask.getMaskedVal = function(val) {
           return p.getMasked(false, val);
        };

       jMask.init = function(onlyMask) {
            onlyMask = onlyMask || false;
            options = options || {};

            jMask.clearIfNotMatch  = $.jMaskGlobals.clearIfNotMatch;
            jMask.byPassKeys       = $.jMaskGlobals.byPassKeys;
            jMask.translation      = $.extend({}, $.jMaskGlobals.translation, options.translation);

            jMask = $.extend(true, {}, jMask, options);

            regexMask = p.getRegexMask();

            if (onlyMask) {
                p.events();
                p.val(p.getMasked());
            } else {
                if (options.placeholder) {
                    el.attr('placeholder' , options.placeholder);
                }

                // this is necessary, otherwise if the user submit the form
                // and then press the "back" button, the autocomplete will erase
                // the data. Works fine on IE9+, FF, Opera, Safari.
                if (el.data('mask')) {
                  el.attr('autocomplete', 'off');
                }

                // detect if is necessary let the user type freely.
                // for is a lot faster than forEach.
                for (var i = 0, maxlength = true; i < mask.length; i++) {
                    var translation = jMask.translation[mask.charAt(i)];
                    if (translation && translation.recursive) {
                        maxlength = false;
                        break;
                    }
                }

                if (maxlength) {
                    el.attr('maxlength', mask.length).data('mask-maxlength', true);
                }

                p.destroyEvents();
                p.events();

                var caret = p.getCaret();
                p.val(p.getMasked());
                p.setCaret(caret);
            }
        };

        jMask.init(!el.is('input'));
    };

    $.maskWatchers = {};
    var HTMLAttributes = function () {
        var input = $(this),
            options = {},
            prefix = 'data-mask-',
            mask = input.attr('data-mask');

        if (input.attr(prefix + 'reverse')) {
            options.reverse = true;
        }

        if (input.attr(prefix + 'clearifnotmatch')) {
            options.clearIfNotMatch = true;
        }

        if (input.attr(prefix + 'selectonfocus') === 'true') {
           options.selectOnFocus = true;
        }

        if (notSameMaskObject(input, mask, options)) {
            return input.data('mask', new Mask(this, mask, options));
        }
    },
    notSameMaskObject = function(field, mask, options) {
        options = options || {};
        var maskObject = $(field).data('mask'),
            stringify = JSON.stringify,
            value = $(field).val() || $(field).text();
        try {
            if (typeof mask === 'function') {
                mask = mask(value);
            }
            return typeof maskObject !== 'object' || stringify(maskObject.options) !== stringify(options) || maskObject.mask !== mask;
        } catch (e) {}
    },
    eventSupported = function(eventName) {
        var el = document.createElement('div'), isSupported;

        eventName = 'on' + eventName;
        isSupported = (eventName in el);

        if ( !isSupported ) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] === 'function';
        }
        el = null;

        return isSupported;
    };

    $.fn.mask = function(mask, options) {
        options = options || {};
        var selector = this.selector,
            globals = $.jMaskGlobals,
            interval = globals.watchInterval,
            watchInputs = options.watchInputs || globals.watchInputs,
            maskFunction = function() {
                if (notSameMaskObject(this, mask, options)) {
                    return $(this).data('mask', new Mask(this, mask, options));
                }
            };

        $(this).each(maskFunction);

        if (selector && selector !== '' && watchInputs) {
            clearInterval($.maskWatchers[selector]);
            $.maskWatchers[selector] = setInterval(function(){
                $(document).find(selector).each(maskFunction);
            }, interval);
        }
        return this;
    };

    $.fn.masked = function(val) {
        return this.data('mask').getMaskedVal(val);
    };

    $.fn.unmask = function() {
        clearInterval($.maskWatchers[this.selector]);
        delete $.maskWatchers[this.selector];
        return this.each(function() {
            var dataMask = $(this).data('mask');
            if (dataMask) {
                dataMask.remove().removeData('mask');
            }
        });
    };

    $.fn.cleanVal = function() {
        return this.data('mask').getCleanVal();
    };

    $.applyDataMask = function(selector) {
        selector = selector || $.jMaskGlobals.maskElements;
        var $selector = (selector instanceof $) ? selector : $(selector);
        $selector.filter($.jMaskGlobals.dataMaskAttr).each(HTMLAttributes);
    };

    var globals = {
        maskElements: 'input,td,span,div',
        dataMaskAttr: '*[data-mask]',
        dataMask: true,
        watchInterval: 300,
        watchInputs: true,
        keyStrokeCompensation: 10,
        // old versions of chrome dont work great with input event
        useInput: !/Chrome\/[2-4][0-9]|SamsungBrowser/.test(window.navigator.userAgent) && eventSupported('input'),
        watchDataMask: false,
        byPassKeys: [9, 16, 17, 18, 36, 37, 38, 39, 40, 91],
        translation: {
            '0': {pattern: /\d/},
            '9': {pattern: /\d/, optional: true},
            '#': {pattern: /\d/, recursive: true},
            'A': {pattern: /[a-zA-Z0-9]/},
            'S': {pattern: /[a-zA-Z]/}
        }
    };

    $.jMaskGlobals = $.jMaskGlobals || {};
    globals = $.jMaskGlobals = $.extend(true, {}, globals, $.jMaskGlobals);

    // looking for inputs with data-mask attribute
    if (globals.dataMask) {
        $.applyDataMask();
    }

    setInterval(function() {
        if ($.jMaskGlobals.watchDataMask) {
            $.applyDataMask();
        }
    }, globals.watchInterval);
}, window.jQuery, window.Zepto));;
"use strict";

(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.civiccuCalc = {
    attach: function (context, settings) {

      const rates = settings.civiccuCalc;

      function formatCurrency(number) {
        // Format currency as whole dollar amount (i.e. $987)
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(number);
      }

      function sumInputValues(elementSelector) {
        // Add up all values for specified input fields
        return jQuery
          .map($(elementSelector), (input) => {
            return [input.value ? parseFloat(input.value) : 0];
          })
          .reduce((sum, currentValue) => sum + currentValue);
      }

      function showErrorMessage(msg) {
        clearErrorMessages();
        $(".calculator__button").before(`<div class="calculator__error">${msg}</div>`);
        return 0;
      }

      function clearErrorMessages() {
        $(".calculator__error").remove();
      }

      function initLoanTermDropdowns() {
        const loanCalcs = {
          monthlyPaymentCalculator: {
            loanType: "vehicle",
            element: $(".calculate-vehicle-monthly-payment"),
          },
          principalCalculator: {
            loanType: "vehicle",
            element: $(".calculate-vehicle-how-much-afford"),
          },
          personalLoan: {
            loanType: "personal",
            element: $(".personal-loan")
          },
        };

        function elementExists (loanCalculator) {
          if (!loanCalculator) return false;
          if (!loanCalculator.element) return false;
          if (!loanCalculator.element.length > 0) return false;
          return true;
        }

        for (let calc in loanCalcs) {
          const loanCalculator = loanCalcs[calc];
          if (elementExists(loanCalculator))
            bindLoanTermDropdownValues(loanCalculator);
        }
      }

      function bindLoanTermDropdownValues(calc) {
        const { loanType, element } = calc;
        const hasValues = loanType && element;
        if (!hasValues) return;

        const creditScore = element.find(".credit-score option:selected").val();

        updateLoanTermDropdownValues(
          loanType,
          element,
          getCreditTier(creditScore)
        );

        $(".credit-score", context).on("change", () => {
          updateLoanTermDropdownValues(
            loanType,
            element,
            getCreditTier(creditScore)
          );
        });
      }

      function updateLoanTermDropdownValues(loanType, element, creditTier) {
        const options = Object.keys(rates[loanType][creditTier]).map((term) =>
          createLoanTermDropdownOption(term)
        );

        element.find(".loan-term").html(options);
      }

      function createLoanTermDropdownOption(term) {
        return `<option value="${term}">${term} Months</option>`;
      }

      function getCreditTier(creditScore) {
        if (creditScore >= 740) {
          return "excellent";
        }
        if (creditScore >= 700) {
          return "very_good";
        }
        if (creditScore >= 660) {
          return "good";
        }
        if (creditScore >= 620) {
          return "fair";
        }
        return "";
      }

      function getInterestRate(loanType, creditScore, termLength) {
        try {
          const rate = rates[loanType][getCreditTier(creditScore)][termLength];
          return rate ? rate : showErrorMessage("Error getting the interest rate.");
        }
        catch {
          return showErrorMessage("Error getting the interest rate.");
        }
      }

      const vehicleLoanCalculator = () => {
        $(".btn-calculate-monthly-payment", context).on("click", () => {
          // User clicked "get my personalized financing" under "What is my
          // monthly payment?"
          clearErrorMessages();

          const calc = $(".calculate-vehicle-monthly-payment");
          const result = calculateMonthlyPayment({
            creditScore: calc.find(".credit-score").val(),
            costOfCar: calc.find(".cost").val(),
            downPayment: calc.find(".down-payment").val(),
            termLength: calc.find(".loan-term").val(),
          });
          calc.find(".result").text(result);
        });

        $(".btn-calculate-principal", context).on("click", () => {
          // User clicked "get my personalized financing" under "How much can I
          // afford?"
          clearErrorMessages();

          const calc = $(".calculate-vehicle-how-much-afford");
          const result = calculatePrincipal({
            creditScore: calc.find(".credit-score").val(),
            monthlyPayment: calc.find(".monthly-payment").val(),
            downPayment: calc.find(".down-payment").val(),
            termLength: calc.find(".loan-term").val(),
          });
          calc.find(".result").text(result);
        });

        function calculateMonthlyPayment (userInput) {
          // Immediately return an error if any of the values in the userInput
          // object are not numbers
          if (Object.values(userInput).some((input) => isNaN(input))) {
            return showErrorMessage("Please input numbers only.");
          }

          try {
            // Pull variable values from user input
            let {creditScore, costOfCar, downPayment, termLength} = {
              ...userInput,
            };

            creditScore = parseFloat(creditScore);
            costOfCar = parseFloat(costOfCar);
            downPayment = parseFloat(downPayment);
            termLength = parseFloat(termLength);

            // Compute principal and interest rate for monthly payment amount
            // formula
            const principal = costOfCar - downPayment;
            const rate =
              getInterestRate("vehicle", creditScore, termLength) / 100 / 12;

            // Compute the monthly payment amount
            const x = Math.pow(1 + rate, termLength);
            const monthly = (principal * x * rate) / (x - 1);

            // If the result is a finite number, the user's input was good and
            // we have meaningful results to display
            // otherwise return an error
            return isFinite(monthly) ? formatCurrency(monthly) : showErrorMessage("Calculation error. Please check your input and try again.");
          }
          catch {
            return showErrorMessage("Calculation error. Please check your input and try again.");
          }
        }

        function calculatePrincipal (userInput) {
          // Immediately return an error if any of the values in the userInput
          // object are not numbers
          if (Object.values(userInput).some((input) => isNaN(input))) {
            return showErrorMessage("Please input numbers only.");
          }

          try {
            // Pull variable values from user input
            let {creditScore, monthlyPayment, downPayment, termLength} = {
              ...userInput,
            };

            creditScore = parseFloat(creditScore);
            monthlyPayment = parseFloat(monthlyPayment);
            downPayment = parseFloat(downPayment);
            termLength = parseFloat(termLength);

            // Compute interest rate for principal loan amount formula
            const rate =
              getInterestRate("vehicle", creditScore, termLength) / 100 / 12;

            // Compute the principal loan amount
            const x = Math.pow(1 + rate, termLength);
            const principal =
              (monthlyPayment * x - monthlyPayment) / (x * rate) + downPayment;

            // If the result is a finite number, the user's input was good and
            // we have meaningful results to display
            // otherwise return an error
            return isFinite(principal) ? formatCurrency(principal) : showErrorMessage("Calculation error. Please check your input and try again.");
          }
          catch {
            return showErrorMessage("Calculation error. Please check your input and try again.");
          }
        }
      };

      const homeEquityLoanCalculator = () => {
        $(".btn-calculate-heloc", context).on("click", () => {
          // User clicked "get my personalized financing"
          clearErrorMessages();

          // Store user input values in constants
          // Add both mortgage balance inputs together to get the total
          // mortgage balance
          const calc = $(".home-equity-loan");

          const appraisedValue = calc.find(".appraised-value").val();
          const totalMortgageBalance = sumInputValues(
            ".home-equity-loan .mortgage-balance"
          );

          // Set up LTV percentage values
          const percentages = [75, 80, 85, 90];

          // For each LTV percentage value, calculate the HELOC and create a
          // list item element
          const listItems = percentages.map((ltv) => {
            const HELOC = calculateHELOC({
              appraisedValue: appraisedValue,
              loanToValuePercentage: ltv,
              mortgageBalance: totalMortgageBalance,
            });
            return `<div class="ltv__group"><span class="ltv__percent">${ltv}%</span> ${HELOC}</div>`;
          });

          $('.ltv__heading').show();
          calc.find(".result").html(listItems);
        });

        function calculateHELOC (userInput) {
          // Immediately return an error if any of the values in the userInput
          // object are not numbers
          if (Object.values(userInput).some((input) => isNaN(input))) {
            return showErrorMessage("Please input numbers only.");
          }

          try {
            // Pull variable values from user input
            let {appraisedValue, loanToValuePercentage, mortgageBalance} = {
              ...userInput,
            };

            appraisedValue = parseFloat(appraisedValue);
            loanToValuePercentage = parseFloat(loanToValuePercentage) / 100;
            mortgageBalance = parseFloat(mortgageBalance);

            // Compute the using the HELOC (Home Equity Line of Credit) formula
            let HELOC = appraisedValue * loanToValuePercentage - mortgageBalance;

            // If calculated HELOC is less than 0, then they do not qualify for
            // the loan So zero it out for display
            if (HELOC < 0) {
              HELOC = 0;
            }

            // If the result is a finite number, the user's input was good and
            // we have meaningful results to display
            // otherwise return an error
            return isFinite(HELOC) ? formatCurrency(HELOC) : showErrorMessage("Calculation error. Please check your input and try again.");
          }
          catch {
            return showErrorMessage("Calculation error. Please check your input and try again.");
          }
        }
      };

      const personalLoanCalculator = () => {
        const creditWorksheet = $(".credit-worksheet");
        const installmentWorksheet = $(".installment-worksheet");
        const worksheet = $(".worksheet");

        creditWorksheet.find(".balance", context).on("keyup", () => {
          creditWorksheet
            .find(".balance-total")
            .val(sumInputValues(".credit-worksheet .balance"));
        });

        creditWorksheet.find(".payment", context).on("keyup", () => {
          creditWorksheet
            .find(".payment-total")
            .val(sumInputValues(".credit-worksheet .payment"));
        });

        installmentWorksheet.find(".balance", context).on("keyup", () => {
          installmentWorksheet
            .find(".balance-total")
            .val(sumInputValues(".installment-worksheet .balance"));
        });

        installmentWorksheet.find(".payment", context).on("keyup", () => {
          installmentWorksheet
            .find(".payment-total")
            .val(sumInputValues(".installment-worksheet .payment"));
        });

        $(".btn-credit-worksheet", context).on("click", (e) => {
          // User clicked "Need help? Try our Credit Card Worksheet."
          e.preventDefault();
          const defaultInputs = $(
            ".credit-balance, .credit-rate, .credit-payment",
            context
          );

          if (creditWorksheet.is(":visible")) {
            creditWorksheet.hide().find("input").val("");
            defaultInputs.removeAttr("disabled");
          }
          else {
            creditWorksheet.show();
            defaultInputs.attr("disabled", "disabled").val("");
          }
        });

        $(".btn-installment-worksheet", context).on("click", (e) => {
          // User clicked "Need help? Try our Installment Debt Worksheet."
          e.preventDefault();
          const defaultInputs = $(
            ".installment-balance, .installment-rate, .installment-payment",
            context
          );

          if (installmentWorksheet.is(":visible")) {
            installmentWorksheet.hide().find("input").val("");
            defaultInputs.removeAttr("disabled");
          }
          else {
            installmentWorksheet.show();
            defaultInputs.attr("disabled", "disabled").val("");
          }
        });

        $(".close-worksheet", context).on("click", () => {
          if (worksheet.is(":visible")) {
            worksheet.hide().find("input").val("");
            defaultInputs.removeAttr("disabled");
          }
        });

        $(".btn-calculate-consolidated-payment", context).on("click", () => {
          // User clicked "get my personalized financing"
          clearErrorMessages();

          const calc = $(".debt-loan");
          const creditBalance =
            $(".credit-balance").cleanVal() ||
            sumInputValues(".credit-worksheet .balance");
          const installmentBalance =
            $(".installment-balance").cleanVal() ||
            sumInputValues(".installment-worksheet .balance");

          const result = calculateMonthlyPayment({
            creditScore: calc.find(".credit-score").val(),
            loanAmount: getTotalPersonalDebtBalance(
              creditBalance,
              installmentBalance
            ),
            termLength: calc.find(".loan-term").val(),
          });
          calc.find(".result").text(result);
        });

        // Add up all credit and installment debt
        function getTotalPersonalDebtBalance(creditBalance, installmentBalance) {
          // Get balances from input fields
          // If worksheet was used, get balances by summing input values from
          // worksheet Otherwise get the balances from the .credit-balance and
          // .installment-balance fields
          const totalPersonalDebtBalance =
            parseFloat(creditBalance) + parseFloat(installmentBalance);

          if (totalPersonalDebtBalance > 60000)
            return showErrorMessage("Our current maximum loan amount is $60,000. Please revise your entries and try again.");

          return totalPersonalDebtBalance;
        }

        $(".btn-calculate-personal-payment", context).on("click", () => {
          // User clicked "get my personalized financing"
          clearErrorMessages();

          const calc = $(".personal-loan");
          const result = calculateMonthlyPayment({
            creditScore: calc.find(".credit-score").val(),
            loanAmount: calc.find(".loan-amount").val(),
            termLength: calc.find(".loan-term").val(),
          });
          calc.find(".result").text(result);
        });

        // Get consolidation loan monthly payment
        function calculateMonthlyPayment(userInput) {
          // Immediately return an error if any of the values in the userInput
          // object are not numbers
          if (Object.values(userInput).some((input) => isNaN(input))) {
            return showErrorMessage("Please input numbers only.");
          }

          try {
            // Pull variable values from user input
            let {creditScore, loanAmount, termLength} = {
              ...userInput,
            };

            creditScore = parseFloat(creditScore);
            loanAmount = parseFloat(loanAmount);
            termLength = parseFloat(termLength);

            // Compute interest rate for monthly payment amount formula
            const rate =
              getInterestRate("personal", creditScore, termLength) / 100 / 12;

            // Compute the monthly payment amount
            const x = Math.pow(1 + rate, termLength);
            const monthly = (loanAmount * x * rate) / (x - 1);

            // If the result is a finite number, the user's input was good and
            // we have meaningful results to display
            // otherwise return an error
            return isFinite(monthly) ? formatCurrency(monthly) : showErrorMessage("Calculation error. Please check your input and try again.");
          }
          catch {
            return showErrorMessage("Calculation error. Please check your input and try again.");
          }
        }
      };

      $(document).ready(() => {
        vehicleLoanCalculator();
        homeEquityLoanCalculator();
        personalLoanCalculator();
        initLoanTermDropdowns();
      });

    },
  };
})(jQuery, Drupal, drupalSettings);
;
