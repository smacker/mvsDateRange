/*global angular */

/*
 jQuery UI Datepicker directive wrapper that allow to select date range
 */

angular.module('mvsDateRange', [])
  .directive('mvsDateRange', function() {
    'use strict';

    // Directive based on:
    // http://www.benknowscode.com/2012/11/selecting-ranges-jquery-ui-datepicker.html

    // Monkey-patching datepicker. Adding `onAfterUpdate` hook.
    if ($.datepicker._defaults.onAfterUpdate === undefined) { // check is already exists
      $.datepicker._defaults.onAfterUpdate = null;
      var datepicker__updateDatepicker = $.datepicker._updateDatepicker;
      $.datepicker._updateDatepicker = function( inst ) {
         datepicker__updateDatepicker.call( this, inst );
         var onAfterUpdate = this._get(inst, 'onAfterUpdate');
         if (onAfterUpdate)
            onAfterUpdate.apply((inst.input ? inst.input[0] : null),
               [(inst.input ? inst.input.val() : ''), inst]);
      };
    }

    return {
      scope: {
        onSet: '=' // callback
      },
      link: function(scope, element, attrs) {
        var createDateRangePicker = function (e) {
          // prevent closing datepicker
          e.stopPropagation();

          // Local variables that save dates
          var currentDate = -1, previousDate = -1,
              // Create hidden element required by jQueryUI DatePicker
              // Don't forget to delete it!
              div = element.data('picker-div'),
              // Close picker correctly
              destroy = function () {
                div.datepicker('destroy');
                div.remove();
                element.removeData('picker-div');
                $('html').off('click', destroy);
              };

          if (div) {
            destroy();
            return;
          }

          div = $("<div />").appendTo('body');
          element.data('picker-div', div);

          // Attach datepicker to div, not input, it prevents close on select date
          div.datepicker({
              // We need a panel to show Done button
              showButtonPanel: true,

              // Add css class to selected days
              beforeShowDay: function (date) {
                var cssClass = '';
                if (date.getTime() >= Math.min(previousDate, currentDate) &&
                    date.getTime() <= Math.max(previousDate, currentDate)) {
                  cssClass = 'date-range-selected';
                }
                return [true, cssClass];
              },

              // Select handler
              onSelect: function (dateText, inst) {
                previousDate = currentDate;
                currentDate = (new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay)).getTime();
                if ( previousDate == -1 || previousDate == currentDate ) {
                  previousDate = currentDate;
                }
              },

              // Manually add button 'Done'
              onAfterUpdate: function (inst) {
                var done = function (e) {
                  var startDate = new Date(Math.min(previousDate, currentDate)),
                      endDate = new Date(Math.max(previousDate, currentDate));

                  // Call callback
                  if (scope.onSet) {
                    scope.$apply(function () {
                      scope.onSet(startDate, endDate);
                    });
                  }
                    
                  destroy();
                };

                $(['<button',
                   ' type="button"',
                   ' class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all"',
                   ' data-handler="hide"',
                   ' data-event="click">Done</button>'].join('')) // button
                   .appendTo(div.find('.ui-datepicker-buttonpane')) // top panel
                   .on('click', done);
              }

          }).position({
              my: "left top",
              at: "left bottom",
              of: element
          });

          // Listen click outside datepicker to correct close
          $('html').on('click', destroy);
        };

        element.on('click', createDateRangePicker);
      }
    };
  });
