// team.js - Complete file with fixed spending chart
const urlParams = new URLSearchParams(window.location.search);
const teamAbbr = urlParams.get('abbr') || 'ATL';
const teamName = urlParams.get('name') || 'Atlanta Braves';
const teamLogo = urlParams.get('logo') || '';
document.getElementById('team-name').textContent = teamName;
document.getElementById('team-logo').src = teamLogo;

// Global color scheme
const colors = {
    primary: '#1f77b4',
    secondary: '#ff7f0e', 
    success: '#2ca02c',
    warning: '#ffbb78',
    danger: '#d62728',
    gold: '#ffd700',
    wins: '#60a5fa',
    spending: '#22c55e',
    postseason: '#ffd700'
};

// Enhanced tooltip creation
function createTooltip() {
    return d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.9)")
        .style("color", "white")
        .style("border-radius", "8px")
        .style("padding", "12px")
        .style("font-size", "13px")
        .style("box-shadow", "0 4px 20px rgba(0,0,0,0.3)")
        .style("backdrop-filter", "blur(10px)")
        .style("border", "1px solid rgba(255,255,255,0.2)")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("transition", "all 0.2s ease");
}

// Initialize charts
createSpendingWinsChart(teamName, teamAbbr);
createPayrollPieChart(teamAbbr);
createSpendingWinsComparisonChart(teamName, teamAbbr);

function createSpendingWinsChart(teamName, teamAbbr) {
    const csvPath = "Spend vs Wins_data.csv";

    fetch(csvPath)
        .then(res => res.arrayBuffer())
        .then(buf => new TextDecoder('utf-16le').decode(buf))
        .then(text => d3.tsvParse(text))
        .then(data => {
            const norm = s => s?.trim().toLowerCase();
            const valid = data.filter(d =>
                d.Team && d["Team Name"] && d.Year &&
                d.Wins && d["Avg. Total Payroll Allocation"]
            );
            const teamData = valid.filter(d =>
                norm(d.Team) === norm(teamAbbr) ||
                norm(d["Team Name"]) === norm(teamName)
            );
            if (!teamData.length) {
                return showError("No data available for this team.");
            }
            const byYear = d3.group(teamData, d => d.Year);
            const playoffValues = ["wildcard", "division winner"];
            const chartData = Array.from(byYear, ([yr, recs]) => {
                const r = recs[0];
                const postseason = playoffValues.includes((r["Postseason"] || "").trim().toLowerCase());
                return {
                    year: +yr,
                    wins: +r.Wins,
                    spending: +r["Avg. Total Payroll Allocation"].replace(/[$,]/g, '') / 1e6,
                    postseason
                };
            }).sort((a,b) => a.year - b.year);

            const avgSpendingPerWin = d3.mean(chartData, d => d.spending / d.wins);
            const avgWins = d3.mean(chartData, d => d.wins);
            const avgSpending = d3.mean(chartData, d => d.spending);

            if (!isNaN(avgSpendingPerWin)) {
                const summary = document.getElementById("team-summary");
                summary.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px;">
            <div style="margin-bottom: 4px;">
                </strong> Average Wins ${avgWins.toFixed(1)} | Average Payroll $${(avgSpending * 1e6).toLocaleString()}
            </div>
            <div>
                <strong>Average Dollar Spent Per Win:</strong> $${(avgSpendingPerWin * 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    `;
                summary.style.textAlign = "center";  // Additional centering for the container
            }

            renderChart(chartData);
        })
        .catch(err => {
            console.error(err);
            showError("Error loading data—check path, encoding, and delimiter.");
        });

    function showError(msg) {
        d3.select("#spending-wins-chart")
            .html(`<p style="color:red;text-align:center;margin-top:50px">${msg}</p>`);
    }

    function renderChart(data) {
        d3.select("#spending-wins-chart").html("");

        const container = document.getElementById("spending-wins-chart");
        const m = { top: 30, right: 100, bottom: 50, left: 60 };
        const w = container.clientWidth - m.left - m.right;
        const h = container.clientHeight - m.top - m.bottom;

        const svg = d3.select("#spending-wins-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${w + m.left + m.right} ${h + m.top + m.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%")
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, w]).padding(0.2);
        const yW = d3.scaleLinear()
            .domain([d3.min(data, d=>d.wins)*0.9, d3.max(data, d=>d.wins)*1.05])
            .range([h, 0]);
        const yS = d3.scaleLinear()
            .domain([d3.min(data, d=>d.spending)*0.9, d3.max(data, d=>d.spending)*1.05])
            .range([h, 0]);

        svg.append("path")
            .datum(data)
            .attr("fill","none").attr("stroke","steelblue").attr("stroke-width",2)
            .attr("d", d3.line()
                .x(d=>x(d.year)+x.bandwidth()/2)
                .y(d=>yW(d.wins))
            );
        svg.append("path")
            .datum(data)
            .attr("fill","none").attr("stroke","green").attr("stroke-width",2)
            .attr("d", d3.line()
                .x(d=>x(d.year)+x.bandwidth()/2)
                .y(d=>yS(d.spending))
            );

        const tooltip = d3.select("body").append("div").attr("class","tooltip");

        svg.selectAll(".dot-w")
            .data(data).enter().append("circle")
            .attr("class", "dot-w")
            .attr("cx", d => x(d.year) + x.bandwidth() / 2)
            .attr("cy", d => yW(d.wins))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", (e, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: ${d.spending.toFixed(1)}M<br/>Postseason: ${d.postseason ? "Yes" : "No"}`);
            })
            .on("mousemove", e => {
                tooltip.style("top", (e.pageY - 10) + "px").style("left", (e.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        svg.selectAll(".postseason-dot")
            .data(data.filter(d => d.postseason))
            .enter().append("circle")
            .attr("class", "postseason-dot")
            .attr("cx", d => x(d.year) + x.bandwidth() / 2)
            .attr("cy", d => yW(d.wins))
            .attr("r", 6)
            .attr("fill", "gold")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .on("mouseover", (e, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: ${d.spending.toFixed(1)}M<br/>Postseason: Yes`);
            })
            .on("mousemove", e => {
                tooltip.style("top", (e.pageY - 10) + "px").style("left", (e.pageX + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        svg.selectAll(".postseason-dot").raise();

        svg.selectAll(".dot-s")
            .data(data).enter().append("circle")
            .attr("cx", d=>x(d.year)+x.bandwidth()/2)
            .attr("cy", d=>yS(d.spending)).attr("r",5).attr("fill","green")
            .on("mouseover", (e,d)=> {
                tooltip.style("display","block")
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: ${d.spending.toFixed(1)}M`);
            })
            .on("mousemove", e=>{
                tooltip.style("top", (e.pageY-10)+"px").style("left", (e.pageX+10)+"px");
            })
            .on("mouseout", ()=> tooltip.style("display","none"));

        svg.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(yW));
        svg.append("g").attr("transform",`translate(${w},0)`).call(d3.axisRight(yS));

        svg.append("text").attr("x", w/2).attr("y", h+40)
            .attr("text-anchor","middle").text("Year");
        svg.append("text").attr("transform","rotate(-90)")
            .attr("x",-h/2).attr("y",-45).attr("text-anchor","middle").text("Wins");
        svg.append("text").attr("transform","rotate(-90)")
            .attr("x",-h/2).attr("y",w+50).attr("text-anchor","middle").text("Spending ($M)");

        const titleContainer = d3.select(".chart-title");
        const legend = titleContainer.append("div").attr("class", "chart-legend-inline");

        legend.append("div").attr("class", "legend-item")
            .html('<div class="legend-color" style="background:steelblue;"></div><span>Wins</span>');
        legend.append("div").attr("class", "legend-item")
            .html('<div class="legend-color" style="background:green;"></div><span>Spending ($M)</span>');
        legend.append("div").attr("class", "legend-item")
            .html('<div class="legend-color" style="background:gold;border:1px solid black;"></div><span>Postseason Appearance</span>');

    }
}
//payroll allocation
function createPayrollPieChart(teamAbbr) {
    const csvPath = "winspay.csv";

    fetch(csvPath)
        .then(res => res.text())
        .then(text => d3.csvParse(text))
        .then(data => {
            if (!data || data.length === 0) throw new Error("No data in file");

            const filtered = data.filter(d => d.Team === teamAbbr);
            if (!filtered.length) {
                throw new Error(`No data available for ${teamAbbr}`);
            }

            const avgTotalPayroll = +filtered[0]["Avg. Total Payroll Allocation"].replace(/[$,]/g, '');

            const categorySums = d3.rollup(
                filtered,
                v => d3.sum(v, d => +d["Avg. Amount of this Payroll Classification"]),
                d => d["Payroll Type"]
            );

            const pieData = Array.from(categorySums, ([type, value]) => ({
                type,
                value,
                percentage: (value / avgTotalPayroll) * 100,
                simpleType: getSimpleType(type)
            }));

            const allowed = ["Active", "Buried", "Injured", "Retained"];
            const cleanData = pieData.filter(d => allowed.includes(d.simpleType));

            const significantCategories = cleanData.filter(d =>
                !d.type.includes("Active 26-Man Roster") &&
                d.percentage > 20
            );

            renderInteractivePie(cleanData, significantCategories);
        });

    function renderInteractivePie(data, significantCategories) {
        d3.select("#pie-chart").html("");

        // Increase container size
        const width = 500, height = 400, radius = Math.min(width, height) / 2 - 50;
        // Increase annotation height to fit all alerts
        const annotationHeight = significantCategories.length > 0 ?
            40 + (significantCategories.length * 20) : 0;

        const svg = d3.select("#pie-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height + annotationHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null)
            .padAngle(0.02);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const outerArc = d3.arc()
            .innerRadius(radius * 1.1)
            .outerRadius(radius * 1.1);

        const color = d3.scaleOrdinal()
            .domain(["Active", "Buried", "Injured", "Retained"])
            .range([colors.primary, colors.secondary, colors.danger, colors.success]);

        const typeDefinitions = {
            "Active": "Healthy players on the team",
            "Injured": "Injured players on the team",
            "Buried": "MLB players in the Minor Leagues",
            "Retained": "Money spent on a non-roster player (trade/release)"
        };

        const tooltip = createTooltip();

        // Create gradient definitions
        const defs = svg.append("defs");
        data.forEach((d, i) => {
            const gradient = defs.append("radialGradient")
                .attr("id", `gradient-${i}`)
                .attr("cx", "30%")
                .attr("cy", "30%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", d3.color(color(d.simpleType)).brighter(0.5));

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", color(d.simpleType));
        });

        // Create pie slices
        const slices = g.selectAll(".slice")
            .data(pie(data))
            .enter().append("g")
            .attr("class", "slice")
            .style("cursor", "pointer");

        // Add paths with animation
        const paths = slices.append("path")
            .attr("d", arc)
            .attr("fill", (d, i) => `url(#gradient-${i})`)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
            .each(function(d) {
                this._current = { startAngle: 0, endAngle: 0 };
            });

        // Animate pie slices
        paths.transition()
            .duration(1000)
            .delay((d, i) => i * 100)
            .attrTween("d", function(d) {
                const interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            });

        // Add labels with lines
        const labels = slices.append("text")
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .style("text-anchor", d => midAngle(d) < Math.PI ? "start" : "end")
            .style("font-size", "13px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .style("opacity", 0)
            .text(d => `${d.data.simpleType} (${d.data.percentage.toFixed(1)}%)`);

        const lines = slices.append("polyline")
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .style("opacity", 0)
            .attr("points", d => {
                const pos = outerArc.centroid(d);
                pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                return [arc.centroid(d), outerArc.centroid(d), pos];
            });

        // Animate labels and lines
        labels.transition()
            .delay(1200)
            .duration(600)
            .style("opacity", 1);

        lines.transition()
            .delay(1200)
            .duration(600)
            .style("opacity", 0.7);

        function midAngle(d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

        // Enhanced interactions with segment filtering
        let selectedSegment = null;

        slices
            .on("mouseover", function(event, d) {
                if (selectedSegment !== null && selectedSegment !== d.data.simpleType) return;

                d3.select(this).select("path")
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1.05)")
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");

                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                const type = d.data.simpleType;
                tooltip.html(`
                    <div style="text-align: center; margin-bottom: 8px;">
                        <strong style="font-size: 16px; color: ${color(type)};">${type}</strong>
                    </div>
                    <div style="text-align: center; margin-bottom: 8px;">
                        <div style="font-size: 18px; font-weight: bold; color: ${colors.gold};">${d.data.value.toLocaleString()}</div>
                        <div style="font-size: 14px; opacity: 0.8;">${d.data.percentage.toFixed(1)}% of payroll</div>
                    </div>
                    <div style="text-align: center; font-style: italic; opacity: 0.9; border-top: 1px solid #555; padding-top: 8px; margin-top: 8px;">
                        ${typeDefinitions[type] || 'Other expenses'}
                    </div>
                    <div style="text-align: center; margin-top: 8px; color: #4CAF50; font-size: 12px;">
                        💡 Click to focus on this category
                    </div>
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                if (selectedSegment !== null) return;

                d3.select(this).select("path")
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1)")
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");

                tooltip.transition()
                    .duration(300)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                event.stopPropagation();

                const clickedType = d.data.simpleType;

                if (selectedSegment === clickedType) {
                    // Deselect - show all segments
                    selectedSegment = null;
                    slices.selectAll("path")
                        .transition()
                        .duration(500)
                        .attr("transform", "scale(1)")
                        .style("opacity", 1)
                        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");

                    centerGroup.select(".center-focus-text").remove();
                    centerGroup.selectAll(".center-text text").style("opacity", 1);
                } else {
                    // Select this segment
                    selectedSegment = clickedType;

                    slices.selectAll("path")
                        .transition()
                        .duration(500)
                        .attr("transform", (data) => data.data.simpleType === clickedType ? "scale(1.1)" : "scale(0.9)")
                        .style("opacity", (data) => data.data.simpleType === clickedType ? 1 : 0.3)
                        .style("filter", (data) => data.data.simpleType === clickedType ?
                            "drop-shadow(0 6px 12px rgba(0,0,0,0.4))" :
                            "drop-shadow(0 1px 2px rgba(0,0,0,0.2))");

                    // Update center text to show focused category
                    centerGroup.selectAll(".center-text text").style("opacity", 0.3);

                    centerGroup.append("g")
                        .attr("class", "center-focus-text")
                        .append("text")
                        .attr("text-anchor", "middle")
                        .attr("dy", "0.5em")
                        .style("font-size", "16px")
                        .style("font-weight", "bold")
                        .style("fill", color(clickedType))
                        .text(`${clickedType}: ${d.data.percentage.toFixed(1)}%`);
                }

                // Add click animation
                d3.select(this).select("path")
                    .transition()
                    .duration(100)
                    .attr("transform", selectedSegment === clickedType ? "scale(1.2)" : "scale(0.8)")
                    .transition()
                    .duration(100)
                    .attr("transform", selectedSegment === clickedType ? "scale(1.1)" : "scale(0.9)");
            });

        // Add click instruction
        g.append("text")
            .attr("x", 0)
            .attr("y", radius + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .style("font-style", "italic")
            .text("💡 Click segments to focus • Click again to reset");

        // Enhanced legend with clickable items
        const legendContainer = svg.append("g")
            .attr("transform", `translate(${width - 500}, 0)`);

        const legendItems = legendContainer.selectAll(".legend-item")
            .data(data)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .style("cursor", "pointer");

        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d.simpleType))
            .attr("rx", 3)
            .style("stroke", "#fff")
            .style("stroke-width", 2);

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .style("fill", "#333")
            .text(d => `${d.simpleType} (${d.percentage.toFixed(1)}%)`);

        // Make legend items interactive
        legendItems
            .on("click", function(event, d) {
                // Trigger the same click behavior as pie slices
                const correspondingSlice = slices.filter(slice => slice.data.simpleType === d.simpleType);
                correspondingSlice.dispatch("click");
            })
            .on("mouseover", function(event, d) {
                d3.select(this).select("rect")
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1.2)");

                // Highlight corresponding pie slice
                const correspondingSlice = slices.filter(slice => slice.data.simpleType === d.simpleType);
                correspondingSlice.select("path")
                    .transition()
                    .duration(200)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.3))");
            })
            .on("mouseout", function(event, d) {
                if (selectedSegment === d.simpleType) return;

                d3.select(this).select("rect")
                    .transition()
                    .duration(200)
                    .attr("transform", "scale(1)");

                // Reset corresponding pie slice
                const correspondingSlice = slices.filter(slice => slice.data.simpleType === d.simpleType);
                correspondingSlice.select("path")
                    .transition()
                    .duration(200)
                    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
            });

        // Add significant spending alert
        if (significantCategories.length > 0) {
            const alertGroup = svg.append("g")
                .attr("transform", `translate(0, ${height})`);

            alertGroup.append("rect")
                .attr("width", width)
                .attr("height", annotationHeight)
                .attr("fill", "none")
                .attr("stroke", "none")
                .attr("stroke-width", 2)
                .attr("rx", 8);

            alertGroup.append("text")
                .attr("x", width / 2)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("font-weight", "bold")
                .style("fill", colors.danger)
                .text("⚠️ Significant Non-Active Spending Alert");

            significantCategories.forEach((category, i) => {
                alertGroup.append("text")
                    .attr("x", width / 2)
                    .attr("y", 40 + (i * 18))
                    .attr("text-anchor", "middle")
                    .style("font-size", "20px")
                    .style("fill", "#666")
                    .text(`• ${category.percentage.toFixed(1)}% on ${category.simpleType} players`);
            });
        }
    }

    function getSimpleType(type) {
        if (type.includes("Active")) return "Active";
        if (type.includes("Buried")) return "Buried";
        if (type.includes("Injured")) return "Injured";
        if (type.includes("Retained")) return "Retained";
        return "Other";
    }
}

//spending vs wins
function createSpendingWinsComparisonChart(teamName, teamAbbr) {
    const csvPath = "Spend vs Wins_data.csv";

    const divisions = {
        'AL East': ['NYY', 'BOS', 'TB', 'TOR', 'BAL'],
        'AL Central': ['CHW', 'CLE', 'DET', 'KC', 'MIN'],
        'AL West': ['HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
        'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
        'NL Central': ['CHC', 'CIN', 'MIL', 'PIT', 'STL'],
        'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF']
    };

    const leagues = {
        'AL': ['NYY', 'BOS', 'TB', 'TOR', 'BAL', 'CHW', 'CLE', 'DET', 'KC', 'MIN', 'HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
        'NL': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH', 'CHC', 'CIN', 'MIL', 'PIT', 'STL', 'ARI', 'COL', 'LAD', 'SD', 'SF']
    };

    let teamDivision = null, teamLeague = null;
    for (const [div, teams] of Object.entries(divisions)) {
        if (teams.includes(teamAbbr)) {
            teamDivision = div;
            teamLeague = div.startsWith('AL') ? 'AL' : 'NL';
            break;
        }
    }

    fetch(csvPath)
        .then(res => res.arrayBuffer())
        .then(buf => new TextDecoder('utf-16le').decode(buf))
        .then(text => d3.tsvParse(text))
        .then(data => {
            const valid = data.filter(d =>
                d.Team && d["Team Name"] && d.Year &&
                d.Wins && d["Avg. Total Payroll Allocation"] && +d.Wins > 0
            );

            const teamAvgSpendingPerWin = d3.rollup(
                valid,
                v => {
                    const totalSpending = d3.sum(v, d => +d["Avg. Total Payroll Allocation"].replace(/[$,]/g, '') / 1e6);
                    const totalWins = d3.sum(v, d => +d.Wins);
                    return totalSpending / totalWins;
                },
                d => d.Team
            );

            const chartData = Array.from(teamAvgSpendingPerWin, ([abbr, spendingPerWin]) => ({
                abbr,
                name: valid.find(d => d.Team === abbr)["Team Name"],
                spendingPerWin
            }));

            // Create enhanced dropdown
            const container = d3.select("#comparison-chart-container");
            
            const controlsDiv = container.insert("div", ":first-child")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .style("align-items", "center")
                .style("margin-bottom", "15px")
                .style("padding", "10px")
                .style("background", "#f8f9fa")
                .style("border-radius", "8px");

            const select = controlsDiv.append("select")
                .attr("id", "comparison-toggle")
                .style("padding", "8px 12px")
                .style("border-radius", "6px")
                .style("border", "1px solid #ddd")
                .style("font-size", "14px")
                .style("background", "white");

            select.selectAll("option")
                .data(["Division", "League", "MLB"])
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);

            // Add sort options
            const sortSelect = controlsDiv.append("select")
                .attr("id", "sort-toggle")
                .style("padding", "8px 12px")
                .style("border-radius", "6px")
                .style("border", "1px solid #ddd")
                .style("font-size", "14px")
                .style("background", "white");

            sortSelect.selectAll("option")
                .data([
                    { value: "spending-desc", label: "Highest Spending per Win" },
                    { value: "spending-asc", label: "Lowest Spending per Win" },
                    { value: "alphabetical", label: "Alphabetical" }
                ])
                .enter()
                .append("option")
                .attr("value", d => d.value)
                .text(d => d.label);
            
            renderInteractiveComparison(chartData, teamAbbr, teamDivision, teamLeague, "Division", "spending-desc");

            select.on("change", function() {
                const scope = d3.select(this).property("value");
                const sortMethod = sortSelect.property("value");
                renderInteractiveComparison(chartData, teamAbbr, teamDivision, teamLeague, scope, sortMethod);
            });

            sortSelect.on("change", function() {
                const scope = select.property("value");
                const sortMethod = d3.select(this).property("value");
                renderInteractiveComparison(chartData, teamAbbr, teamDivision, teamLeague, scope, sortMethod);
            });
        })
        .catch(err => {
            console.error(err);
            showError("Error loading data for comparison chart.", "#comparison-chart");
        });

    function renderInteractiveComparison(data, teamAbbr, teamDivision, teamLeague, scope, sortMethod) {
        d3.select("#comparison-chart").html("");

        let filteredData;
        if (scope === "Division") {
            filteredData = data.filter(d => divisions[teamDivision].includes(d.abbr));
        } else if (scope === "League") {
            filteredData = data.filter(d => leagues[teamLeague].includes(d.abbr));
        } else {
            filteredData = data;
        }

        // Apply sorting
        switch(sortMethod) {
            case "spending-desc":
                filteredData.sort((a, b) => b.spendingPerWin - a.spendingPerWin);
                break;
            case "spending-asc":
                filteredData.sort((a, b) => a.spendingPerWin - b.spendingPerWin);
                break;
            case "alphabetical":
                filteredData.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        const container = document.getElementById("comparison-chart");
        const margin = { top: 40, right: 40, bottom: 120, left: 80 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        const svg = d3.select("#comparison-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.abbr))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.spendingPerWin) * 1.1])
            .range([height, 0]);

        // Add gradient definitions
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "bar-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colors.primary)
            .attr("stop-opacity", 0.8);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colors.primary)
            .attr("stop-opacity", 0.4);

        const highlightGradient = defs.append("linearGradient")
            .attr("id", "highlight-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%");

        highlightGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colors.gold)
            .attr("stop-opacity", 1);

        highlightGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#f59e0b")
            .attr("stop-opacity", 0.8);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-weight", d => d === teamAbbr ? "bold" : "normal")
            .style("fill", d => d === teamAbbr ? colors.gold : "#333")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        g.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `$${d.toFixed(1)}M`))
            .selectAll("text")
            .style("font-size", "12px");

        // Add gridlines
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat("")
            )
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.3);

        const tooltip = createTooltip();

        // Create bars
        const bars = g.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.abbr))
            .attr("y", height)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", d => d.abbr === teamAbbr ? "url(#highlight-gradient)" : "url(#bar-gradient)")
            .style("cursor", "pointer")
            .style("stroke", d => d.abbr === teamAbbr ? colors.gold : "none")
            .style("stroke-width", d => d.abbr === teamAbbr ? 3 : 0);

        // Animate bars
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr("y", d => y(d.spendingPerWin))
            .attr("height", d => height - y(d.spendingPerWin));

        // Add value labels on bars
        const labels = g.selectAll(".bar-label")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", d => x(d.abbr) + x.bandwidth() / 2)
            .attr("y", height)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .style("opacity", 0);

        labels.transition()
            .duration(800)
            .delay((d, i) => i * 50 + 400)
            .attr("y", d => y(d.spendingPerWin) - 5)
            .style("opacity", 1)
            .text(d => `$${d.spendingPerWin.toFixed(1)}M`);

        // Enhanced interactions with team highlighting and comparison
        bars
            .on("mouseover", function(event, d) {
                // Highlight hovered bar
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style("filter", "brightness(1.2)")
                    .style("stroke", colors.gold)
                    .style("stroke-width", 3);

                // Dim other bars
                bars.filter(data => data.abbr !== d.abbr)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.6);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                
                const rank = filteredData.findIndex(team => team.abbr === d.abbr) + 1;
                const efficiency = d.spendingPerWin;
                const currentTeamEfficiency = filteredData.find(team => team.abbr === teamAbbr)?.spendingPerWin || 0;
                const comparison = efficiency - currentTeamEfficiency;
                const comparisonText = comparison > 0 ? 
                    `${Math.abs(comparison).toFixed(2)}M more per win` : 
                    `${Math.abs(comparison).toFixed(2)}M less per win`;
                const comparisonColor = comparison > 0 ? colors.danger : colors.success;
                
                tooltip.html(`
                    <div style="text-align: center; margin-bottom: 8px;">
                        <strong style="font-size: 16px; color: ${d.abbr === teamAbbr ? colors.gold : colors.primary};">${d.name}</strong>
                        ${d.abbr === teamAbbr ? '<div style="color: #ffd700; font-size: 12px;">⭐ Your Team</div>' : ''}
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 8px 0;">
                        <div style="text-align: center;">
                            <div style="font-size: 11px; opacity: 0.7;">Spending per Win</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${colors.primary};">${efficiency.toFixed(2)}M</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; opacity: 0.7;">Rank in ${scope}</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${rank <= 3 ? colors.success : rank <= 7 ? colors.warning : colors.danger};">#${rank}</div>
                        </div>
                    </div>
                    ${d.abbr !== teamAbbr ? `
                        <div style="text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #555;">
                            <div style="font-size: 11px; opacity: 0.7;">vs ${teamAbbr}</div>
                            <div style="color: ${comparisonColor}; font-weight: bold; font-size: 14px;">
                                ${comparisonText}
                            </div>
                        </div>
                    ` : ''}
                    <div style="text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #555;">
                        <div style="font-size: 11px; opacity: 0.7;">Efficiency Rating</div>
                        <div style="color: ${efficiency < 2 ? colors.success : efficiency < 3 ? colors.warning : colors.danger}; font-weight: bold;">
                            ${efficiency < 2 ? 'Excellent' : efficiency < 3 ? 'Good' : 'Poor'}
                        </div>
                    </div>
                    ${d.abbr !== teamAbbr ? '<div style="text-align: center; margin-top: 8px; color: #4CAF50; font-size: 11px;">💡 Click to compare teams</div>' : ''}
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                // Reset all bars
                bars.transition()
                    .duration(200)
                    .style("filter", "brightness(1)")
                    .style("stroke", d => d.abbr === teamAbbr ? colors.gold : "none")
                    .style("stroke-width", d => d.abbr === teamAbbr ? 3 : 0)
                    .style("opacity", 1);

                tooltip.transition()
                    .duration(300)
                    .style("opacity", 0);
            });

        // Add labels
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 100)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Team");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Spending per Win ($M)");

        // Add title with current settings
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text(`${scope} Comparison - ${sortMethod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    }

    function showError(msg, selector) {
        d3.select(selector)
            .html(`<p style="color:red;text-align:center;margin-top:50px">${msg}</p>`);
    }
}
