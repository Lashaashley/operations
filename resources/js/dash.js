  document.addEventListener('DOMContentLoaded', function () {
    // Turnover Trends Chart
     const chartDataElement = document.getElementById('chart-data');
    const turnoverData = JSON.parse(chartDataElement.dataset.turnover);
    const paymentsData = JSON.parse(chartDataElement.dataset.payments);
    const netpayData = JSON.parse(chartDataElement.dataset.netpay);

    // Rest of your chart code remains the same...
    const series = [];

    for (const actionType in turnoverData) {
        const seriesData = [];
        const actionName = actionType === 'JOIN' ? 'Hiring' : 'Dismissal';
        
        for (let i = 0; i < turnoverData[actionType].length; i++) {
            const period = turnoverData[actionType][i].period;
            const yValue = turnoverData[actionType][i].count;
            seriesData.push([period, yValue]);
        }
        
        series.push({
            name: actionName,
            data: seriesData,
            color: actionType === 'JOIN' ? '#00FF00' : '#FF0000'
        });
    }

    const monthNames = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };

    Highcharts.chart('container', {
        title: {
            text: 'Agents Turnover Trends',
            align: 'left'
        },
        subtitle: {
            text: 'Monthly turnover rates',
            align: 'left'
        },
        yAxis: {
            title: {
                text: 'Number of Agents'
            },
            tickPixelInterval: 40,
            minTickInterval: 1,
            labels: {
                formatter: function () {
                    return Math.round(this.value);
                }
            }
        },
        xAxis: {
            type: 'category',
            labels: {
                formatter: function () {
                    const monthPart = this.value.split('-')[1];
                    return monthNames[monthPart];
                }
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                }
            }
        },
        credits: {
            enabled: false
        },
        series: series,
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });

    // Agents Earnings Chart
    //const paymentsData = {!! json_encode($paymentsData) !!};
    
    Highcharts.chart('attendanceChartContainer', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Agents Earnings by Period'
        },
        subtitle: {
            text: ''
        },
        series: paymentsData.series,
        xAxis: {
            categories: paymentsData.periods,
            title: {
                text: 'Period'
            },
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount'
            },
            labels: {
                formatter: function() {
                    return this.value.toLocaleString();
                }
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.2f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: paymentsData.series,
        credits: {
            enabled: false
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ["downloadPNG", "downloadJPEG", "downloadPDF", "downloadCSV"]
                }
            }
        }
    });

    // Net Pay Chart
    
    
    Highcharts.chart('netpayChartContainer', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Agents Netpay by Period'
        },
        subtitle: {
            text: ''
        },
        series: netpayData.series,
        xAxis: {
            categories: netpayData.periods,
            title: {
                text: 'Period'
            },
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount'
            },
            labels: {
                formatter: function() {
                    return this.value.toLocaleString();
                }
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.2f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: netpayData.series,
        credits: {
            enabled: false
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ["downloadPNG", "downloadJPEG", "downloadPDF", "downloadCSV"]
                }
            }
        }
    });

    /* ── Live date ───────────────────────────────────────────── */
(function() {
    var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var now    = new Date();
    var str    = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ' ' + now.getFullYear();
    var el = document.getElementById('dashDate');
    if (el) el.textContent = str;
})();


});