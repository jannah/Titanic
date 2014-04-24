/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function drawChart2(data)
{
    var tooltip = d3.select("#tooltip");
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    padding = 10, pointRadius = 10, pointGap = 2,
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;
    var catH_count = data.length
            ,
            catV_count = d3.max(data, function(d) {
                return d.values.length;
            }),
            max_points = d3.max(data, function(d) {
//        console.log(d)
                return d3.max(d.values, function(f) {
                    return f.values.count;
                });
            }),
            pointH_count = Math.floor(((width - padding) / catH_count) / (pointRadius + pointGap)),
            pointV_count = Math.floor(max_points / pointH_count);
    ;


    var xValue = function(d, i, hcat) {
        var val = hcat + (i % pointH_count) / pointH_count;
//        console.log(d + "\t" + i + "\t" + hcat + "\t" + val);
        return val;

    }, // data -> value
            xScale = d3.scale.linear().range([0, width]), // value -> display
            xMap = function(d, i, hcat) {

//                console.log(d + "\t" + i + "\t" + hcat);
                var val = xScale(xValue(d, i, hcat));
//                var val = xValue(d, i, hcat);
//                console.log(val);
                return val;
            }, // data -> display
            xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    var yValue = function(d, i, vcat) {
        var val = vcat + Math.floor(i / pointH_count) / pointV_count;
//        console.log(d + "\t" + i + "\t" + vcat + "\t" + val);
        return val;

    }, // data -> value
            yScale = d3.scale.linear().range([0, height]), // value -> display
            yMap = function(d, i, vcat) {
                var val = yScale(yValue(d, i, vcat));
//                var val = yValue(d, i, vcat);
//                console.log(val);
                return val;
            }, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left");

    xScale.domain([0, catH_count]);
    yScale.domain([0, catV_count]);
//    yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

    var cValue = function(d, cat) {
        return cat;
    },
            color = d3.scale.category10();
    var svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
            .attr("class", "x axis")
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
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("");

    // draw dots
    for (var k = 0, l = data.length; k < l; k++)
    {
        console.log(data[k]);
        for (var m = 0, n = data[k].values.length; m < n; m++)
        {
            console.log(data[k].values[m]);
//            svg.selectAll(".dot")
            var cname = data[k].key + "-" + data[k].values[m].key;
            console.log(cname)
//            svg.selectAll("."+cname)
            svg.append('g').selectAll('.dot')
                    .data(data[k].values[m].values.list)
                    .enter().append("circle")
                    .attr("class", "dot " + cname)
                    .attr("r", pointRadius / 2)
                    .attr("cx", function(d, i) {
//                        console.log(xMap(d.id,i,k));
                        return xMap(d.id, i, k);
                    })
                    .attr("cy", function(d, i) {
//                        console.log(yMap(d.id,i,m));
                        return yMap(d.id, i, m);
                    })
                    .style("fill", function(d) {

                        return color(cValue(d.id, k));
                    })
                    .on("mouseover", function(d, i) {
                        tooltip.transition()
                                .duration(200)
                                .style("opacity", .9);
                        tooltip.html(formatTooltip(d, xValue(d[i], i, k), yValue(d[i], i, m)))
                                .style("left", (d3.event.pageX + 5) + "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", function(d) {
                        tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                    });
        }

    }
    // draw legend
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
}

