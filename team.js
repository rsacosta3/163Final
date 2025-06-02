// team.js
const urlParams = new URLSearchParams(window.location.search);
const teamAbbr = urlParams.get('abbr') || 'ATL';
const teamName = urlParams.get('name') || 'Atlanta Braves';
const teamLogo = urlParams.get('logo') || '';
document.getElementById('team-name').textContent = teamName;
document.getElementById('team-logo').src = teamLogo;

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

            // ✅ ADDITION: Compute and inject the summary
            const avgSpendingPerWin = d3.mean(chartData, d => d.spending / d.wins);
            if (!isNaN(avgSpendingPerWin)) {
                const summary = document.getElementById("team-summary");
                summary.textContent = `${teamName} Average Dollar Spent Per Win ('21–'24): $${(avgSpendingPerWin * 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: $${d.spending.toFixed(1)}M<br/>Postseason: ${d.postseason ? "Yes" : "No"}`);
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
                    .html(`<strong>${d.year}</strong><br/>Wins: ${d.wins}<br/>Spending: $${d.spending.toFixed(1)}M<br/>Postseason: Yes`);
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
        legend.append("div").attr("class", "legend-item")
            .html('<div class="legend-color" style="background:gold;border:1px solid black;"></div><span>Postseason Appearance</span>');

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

function createSpendingWinsComparisonChart(teamName, teamAbbr) {
     const csvPath = "Spend vs Wins_data.csv";

    // Divisions
    const divisions = {
        'AL East': ['NYY', 'BOS', 'TB', 'TOR', 'BAL'],
        'AL Central': ['CHW', 'CLE', 'DET', 'KC', 'MIN'],
        'AL West': ['HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
        'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
        'NL Central': ['CHC', 'CIN', 'MIL', 'PIT', 'STL'],
        'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF']
    };
    // Leagues
    const leagues = {
        'AL': ['NYY', 'BOS', 'TB', 'TOR', 'BAL', 'CHW', 'CLE', 'DET', 'KC', 'MIN', 'HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
        'NL': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH', 'CHC', 'CIN', 'MIL', 'PIT', 'STL', 'ARI', 'COL', 'LAD', 'SD', 'SF']
    };

    // Find teams division and leaue
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
            const norm = s => s?.trim().toLowerCase();
            const valid = data.filter(d =>
                d.Team && d["Team Name"] && d.Year &&
                d.Wins && d["Avg. Total Payroll Allocation"] && +d.Wins > 0
            );

            // Get spending average
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

            // Create dropdown list for division, league, mlb
            const select = d3.select("#comparison-chart-container")
                .insert("select", ":first-child")
                .attr("id", "comparison-toggle")
                .style("margin-bottom", "10px");
            select.selectAll("option")
                .data(["Division", "League", "MLB"])
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);

            
            renderComparisonChart(chartData, teamAbbr, teamDivision, teamLeague, "Division");

            // update when we toggle
            select.on("change", function() {
                const scope = d3.select(this).property("value");
                renderComparisonChart(chartData, teamAbbr, teamDivision, teamLeague, scope);
            });
        })
        .catch(err => {
            console.error(err);
            showError("Error loading data for comparison chart.", "#comparison-chart");
        });

    function renderComparisonChart(data, teamAbbr, teamDivision, teamLeague, scope) {
        d3.select("#comparison-chart").html("");

        // Filter data based on selection
        let filteredData;
        if (scope === "Division") {
            filteredData = data.filter(d => divisions[teamDivision].includes(d.abbr));
        } else if (scope === "League") {
            filteredData = data.filter(d => leagues[teamLeague].includes(d.abbr));
        } else {
            filteredData = data;
        }

        // Sort by spending per win (descending)
        filteredData.sort((a, b) => b.spendingPerWin - a.spendingPerWin);

        const container = document.getElementById("comparison-chart");
        const m = { top: 30, right: 30, bottom: 100, left: 60 };
        const w = container.clientWidth - m.left - m.right;
        const h = container.clientHeight - m.top - m.bottom;

        const svg = d3.select("#comparison-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${w + m.left + m.right} ${h + m.top + m.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%")
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);

        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.abbr))
            .range([0, w])
            .padding(0.05);
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.spendingPerWin) * 1.1])
            .range([h, 0]);

        const tooltip = d3.select("body").append("div").attr("class", "tooltip");

        svg.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.abbr))
            .attr("y", d => y(d.spendingPerWin))
            .attr("width", x.bandwidth())
            .attr("height", d => h - y(d.spendingPerWin))
            .attr("fill", d => d.abbr === teamAbbr ? "gold" : "steelblue")
            .on("mouseover", (e, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>${d.name}</strong><br/>$${d.spendingPerWin.toFixed(2)}M per Win`);
            })
            .on("mousemove", e => {
                tooltip.style("top", (e.pageY - 10) + "px").style("left", (e.pageX + 10) + "px");
            })
        .on("mouseout", () => tooltip.style("display", "none"));

        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)"); // Rotate labels for readability
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `$${d.toFixed(1)}M`));

        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h + 80)
            .attr("text-anchor", "middle")
            .text("Team");
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", -49)
            .attr("text-anchor", "middle")
            .text("Spending per Win ($M)");

        const titleContainer = d3.select("#comparison-chart-container .chart-title");
        titleContainer.html(`Spending per Win Comparison (${scope})`);
    }

    function showError(msg, selector) {
        d3.select(selector)
            .html(`<p style="color:red;text-align:center;margin-top:50px">${msg}</p>`);
    }
}
