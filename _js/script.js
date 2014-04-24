/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function() {
    init();
});

var passengers = {},
        headers = {pclass: "int", survived: "bool", name: "string",
            sex: 'string', age: "float", sibsp: "int", parch: "int",
            ticket: "string", fare: "flaot", cabin: "string",
            embarked: "string", boat: "string", body: "string",
            "home.dest": "string"},
boolMap = {survived: {0: "survived", 1: "died"}};
var tooltip = d3.select("#tooltip");
var chart;
var changeCount = 1;
function init()
{
    var data = readCSV("_data/titanic_raw.csv");
    passengers = cleanData(data);
    console.log(passengers);
    var sex = prepareDatasets(passengers, "sex", "survived");
    var pclass = prepareDatasets(passengers, "pclass", "survived");
//    var force = d3.chart.force(passengers)
//    force.start();
//    console.log(sex);
    drawChart(passengers);


    console.log(pclass);
}

function changeData()
{
    var key1 = $('#select-data').val(), key2 = $('#select-data2').val();

    var data = prepareDatasets(passengers, key1, key2);
    chart.update(data);
}
function prepareDatasets(data, key, key2)
{
    var nested = d3.nest()
            .key(function(d) {
                return d[key];
            }).sortKeys(d3.ascending)
            .key(function(d) {
                if (headers[key2] === "bool")
                    return boolMap[key2][d[key2]];
            })
            .rollup(function(leaves) {
                var list = [];
                for (var i = 0, j = leaves.length; i < j; i++)
                {
                    var leaf = leaves[i];
                    list.push(leaf);
                }
                return {'list': list, count: leaves.length};
            })
            .entries(data);
    return nested;
}
function cleanData(data)
{
    for (var i = 0, j = data.length; i < j; i++)
    {
        var row = data[i];
        for (var col in headers)
        {
            if (headers[col] === "float")
                row[col] = parseFloat(row[col]);
            else if (headers[col] === "int")
                row[col] = parseInt(row[col]);
            else if (headers[col] === "bool")
            {
                row[col] = parseInt(row[col]);
                row[col + "_bool"] = (row[col] === "1");
            }

        }
        row['id'] = i;
    }
    return data;
}
d3.chart = d3.chart || {};
d3.chart.force = function(data)
{
    var self = {};
    var width = 960,
            height = 500;

    var fill = d3.scale.category10();

    var nodes = d3.range(data.length).map(function(i) {
        data[i]['index' ] = i;
        return data[i];
    });
    console.log(nodes);
    var force, svg, node;
    self.start = function() {


        force = d3.layout.force()
                .nodes(nodes)
                .size([width, height])
                .on("tick", self.tick)
//                .alpha(0)
                .start();

        svg = d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", height);

        node = svg.selectAll(".node")
                .data(data)
                .enter().append("circle")
                .attr("class", "node")
                .attr("cx", function(d, i) {
                    return d.x;
                })
                .attr("cy", function(d, i) {
                    return d.y;
                })
                .attr("r", 5)
                .style("fill", function(d, i) {
                    return fill(i & 3);
                })
                .style("stroke", function(d, i) {
                    return d3.rgb(fill(i & 3)).darker(2);
                })
                .on("mousedown", function(d) {
                    d3.event.stopPropagation();
                })
                .on("mouseover", function(d) {
                    console.log("tooltip")
                    showTooltip(formatTooltip(d, d.x, d.y),
                            d3.event.pageX + 5,
                            d3.event.pageY - 28);
                })
                .on("mouseout", function(d) {
                    hideTooltip();
                });
        ;

        svg.style("opacity", 1e-6)
                .transition()
                .duration(100)
                .style("opacity", 1);

        d3.select("body")
                .on("mousedown", self.mousedown);
    }
    self.tick = function(e) {

        // Push different nodes in different directions for clustering.
        var k = 6 * e.alpha;
//        console.log(e.alpha);
        nodes.forEach(function(o, i) {
            o.y += i & 1 ? k : -k;
            o.x += i & 2 ? k : -k;
        });

        node.attr("cx", function(d) {
            return d.x;
        })
                .attr("cy", function(d) {
                    return d.y;
                });
    };

    self.mousedown = function() {
        nodes.forEach(function(o, i) {
            o.x += (Math.random() - .5) * 40;
            o.y += (Math.random() - .5) * 40;
        });
        force.resume();
    };
    return self;
}

function drawChart(data)
{
    chart = dotChart();
    chart.draw(data);

}

dotChart = function() {
    var self = {}, svg,
            tooltip = d3.select("#tooltip"),
            margin = {top: 20, right: 20, bottom: 30, left: 40},
    padding = 10, pointRadius = 10, pointGap = 2,
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom,
            catH_count = 1, catV_count = 1,
            max_points = 0, pointH_count = 0, pointV_count = 0;

    var xValue, xScale, xMap, xAxis, yValue, yScale, yMap, yAxis;
    var cValue = function(d, cat) {
        return cat;
    },
            color = d3.scale.category10();

    self.prepareParams = function(data) {
        if (!data[0].values)
        {
            catH_count = 1;
            catV_count = 1;
            max_points = data.length
            data = [{key: "data", values: data}]
            console.log(data);
        }
        else
        {
            catH_count = data.length;
            catV_count = d3.max(data, function(d) {
                return d.values.length;
            });
            max_points = d3.max(data, function(d) {
//        console.log(d)
                return d3.max(d.values, function(f) {
                    return f.values.count;
                });
            });
        }

        pointH_count = Math.floor(((width - padding) / catH_count) / (pointRadius + pointGap));
        pointV_count = Math.floor(max_points / pointH_count);

        xValue = function(d, i, hcat) {
            return hcat + (i % pointH_count) / pointH_count;
        }; // data -> value
        xScale = d3.scale.linear().range([0, width]); // value -> display
        xMap = function(d, i, hcat) {
            return xScale(xValue(d, i, hcat));
        } ; // data -> display
                xAxis = d3.svg.axis().scale(xScale).orient("bottom");
        yValue = function(d, i, vcat) {
            return vcat + Math.floor(i / pointH_count) / pointV_count;

        };// data -> value
        yScale = d3.scale.linear().range([0, height]); // value -> display
        yMap = function(d, i, vcat) {
            return yScale(yValue(d, i, vcat));
        }; // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");
        cValue = function(d, cat) {
            return cat;
        };
        color = d3.scale.category10();
        xScale.domain([0, catH_count]);
        yScale.domain([0, catV_count]);
        return data;
    }
    self.draw = function(data)
    {

//    yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

        data = self.prepareParams(data);
        svg = d3.select("#chart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
                .attr("class", "x axis x-axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text("Calories");

        // y-axis
        svg.append("g")
                .attr("class", "y axis y-axis")
                .call(yAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("");

        // draw dots
//        console.log(data);
        for (var k = 0, l = data.length; k < l; k++)
        {
            console.log(data[k]);
            var subdata = data[k].values;
            for (var m = 0, n = catV_count; m < n; m++)
            {
                var cname = data[k].key, list;
                if (subdata[m].key)
                {
                    list = subdata[m].values.list;
                    cname += "-" + data[k].values[m].key;
                }
                else
                {
                    list = subdata;
                }
                svg.append('g').selectAll('.dot')
                        .data(list)
                        .enter().append("circle")
                        .attr("class", function(d, i) {
                            return  "dot " + cname;
                        })
                        .attr("id", function(d, i) {
                            return "circle-" + d.id;
                        })
                        .attr("data-id", function(d, i) {
                            return d.id;
                        })
                        .attr("r", pointRadius / 2)
                        .attr("cx", function(d, i) {
                            return xMap(d.id, i, k);
                        })
                        .attr("cy", function(d, i) {
                            return yMap(d.id, i, m);
                        })
                        .style("fill", function(d) {
                            return color(cValue(d.id, k));
                        })
                        .on("mouseover", function(d, i) {
                            showTooltip(formatTooltip(d, xValue(d[i], i, k), yValue(d[i], i, m)),
                                    d3.event.pageX + 5,
                                    d3.event.pageY - 28);
                        })
                        .on("mouseout", function(d) {
                            hideTooltip();
                        });
            }

        }
        self.drawLegend();

    };
    self.update = function(data) {
        data = self.prepareParams(data);
//
//        yAxis.Scale(yScale);
//        xAxis.Scale(xScale);
        for (var k = 0, l = data.length; k < l; k++)
        {
            console.log(data[k]);
            var subdata = data[k].values;
            for (var m = 0, n = catV_count; m < n; m++)
            {

                var cname = data[k].key, list;
                if (subdata[m].key)
                {
                    list = subdata[m].values.list;
                    cname += "-" + data[k].values[m].key;
                }
                else
                {
                    list = subdata;
                }
                console.log(cname);
                console.log(list)
                for (var o = 0, p = list.length; o < p; o++)
                {
                    var item = list[o];
                    svg.selectAll("#circle-" + item.id)
                            .transition().duration(2000)
                            .attr("class", "dot " + cname)
                            .attr("r", pointRadius / 2)
                            .attr("cx", function(d, i) {
                                return xMap(item.id, o, k);
                            })
                            .attr("cy", function(d, i) {
                                return yMap(item.id, o, m);
                            })
                            .style("fill", function(d) {
                                return color(cValue(item.id, k));
                            });
                }
//                svg.selectAll('.dot')
//                        .data(list)
//                        .enter().append("circle")
//                        .attr("class", "dot " + cname)
//                        .attr("r", pointRadius / 2)
//                        .attr("cx", function(d, i) {
//                            return xMap(d.id, i, k);
//                        })
//                        .attr("cy", function(d, i) {
//                            return yMap(d.id, i, m);
//                        })
//                        .style("fill", function(d) {
//                            return color(cValue(d.id, k));
//                        })
//                        .on("mouseover", function(d, i) {
//                            showTooltip(formatTooltip(d, xValue(d[i], i, k), yValue(d[i], i, m)),
//                                    d3.event.pageX + 5,
//                                    d3.event.pageY - 28);
//                        })
//                        .on("mouseout", function(d) {
//                            hideTooltip();
//                        });
            }

        }
    };
    self.drawLegend = function() {
        var legend = svg.selectAll(".legend")
                .data(color.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) {
                    return "translate(0," + i * 20 + ")";
                });

        // draw legend colored rectangles
        legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

        // draw legend text
        legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) {
                    return d;
                });
    };
    return self;
};

function formatTooltip(d, x, y)
{
    var html = d["id"] + "<br/> (" + Math.round(x * 100) / 100
            + ", " + Math.round(y * 100) / 100 + ")" + "<br/>" + d.name;
    console.log(html);
    return html;
}

function showTooltip(content, x, y)
{
//    console.log("tooltip")
    var tooltip = d3.select("#tooltip");
    tooltip.transition()
            .duration(200)
            .style("opacity", .9);
    tooltip.html(content)
            .style("left", x + "px")
            .style("top", y + "px");
}
function hideTooltip()
{
    d3.select("#tooltip").transition().duration(200).style("opacity", 0);
}