// team.js
const urlParams = new URLSearchParams(window.location.search);
const teamAbbr = urlParams.get('abbr') || 'ATL';
const teamName = urlParams.get('name') || 'Atlanta Braves';
const teamLogo = urlParams.get('logo') || '';
document.getElementById('team-name').textContent = teamName;
document.getElementById('team-logo').src = teamLogo;

createSpendingWinsChart(teamName, teamAbbr);
createPayrollPieChart(teamAbbr);

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
            const chartData = Array.from(byYear, ([yr, recs]) => {
                const r = recs[0];
                return {
                    year: +yr,
                    wins: +r.Wins,
                    spending: +r["Avg. Total Payroll Allocation"].replace(/[$,]/g, '') / 1e6
                };
            }).sort((a,b) => a.year - b.year);
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
            .attr("cx", d=>x(d.year)+x.bandwidth()/2)
            .attr("cy", d=>yW(d.wins)).attr("r",5).attr("fill","steelblue")
            .on("mouseover", (e,d)=> {
                tooltip.style("display","block")
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: $${d.spending.toFixed(1)}M`);
            })
            .on("mousemove", e=>{
                tooltip.style("top", (e.pageY-10)+"px").style("left", (e.pageX+10)+"px");
            })
            .on("mouseout", ()=> tooltip.style("display","none"));

        svg.selectAll(".dot-s")
            .data(data).enter().append("circle")
            .attr("cx", d=>x(d.year)+x.bandwidth()/2)
            .attr("cy", d=>yS(d.spending)).attr("r",5).attr("fill","green")
            .on("mouseover", (e,d)=> {
                tooltip.style("display","block")
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: $${d.spending.toFixed(1)}M`);
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
    }
}

function createPayrollPieChart(teamAbbr) {
    const csvPath = "winspay.csv";

    fetch(csvPath)
        .then(res => res.text())
        .then(text => d3.csvParse(text))
        .then(data => {
            const filtered = data.filter(d => d.Team === teamAbbr);
            if (!filtered.length) {
                d3.select("#pie-chart").html("<p style='color:red;text-align:center'>No data available</p>");
                return;
            }

            const categorySums = d3.rollup(
                filtered,
                v => d3.sum(v, d => +d["Avg. Amount of this Payroll Classification"]),
                d => d["Payroll Type"]
            );

            const pieData = Array.from(categorySums, ([type, value]) => ({ type, value }));

            const allowed = ["Active", "Buried", "Injured", "Retained"];
            const cleanData = pieData.filter(d => allowed.includes(getSimpleType(d.type)));

            renderPie(cleanData);
        });

    function renderPie(data) {
        d3.select("#pie-chart").html("");

        const width = 400, height = 300, radius = Math.min(width, height) / 2;

        const svg = d3.select("#pie-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height + 40}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);

        const color = d3.scaleOrdinal()
            .domain(["Active", "Buried", "Injured", "Retained"])
            .range(["#1f77b4", "#ff7f0e", "#d62728", "#2ca02c"]);

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("display", "none");

        svg.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(getSimpleType(d.data.type)))
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>${getSimpleType(d.data.type)}</strong><br/>$${d.data.value.toLocaleString()}`);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        const titleContainer = d3.select("#pie-chart-container .chart-title");
        const legend = titleContainer.append("div").attr("class", "chart-legend-inline");

        data.forEach(d => {
            const type = getSimpleType(d.type);
            legend.append("div").attr("class", "legend-item")
                .html(`<div class="legend-color" style="background:${color(type)};"></div><span>${type}</span>`);
        });
    }

    function getSimpleType(type) {
        if (type.includes("Active")) return "Active";
        if (type.includes("Buried")) return "Buried";
        if (type.includes("Injured")) return "Injured";
        if (type.includes("Retained")) return "Retained";
        return "Other";
    }
}