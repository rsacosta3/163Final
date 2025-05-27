// team.js
const urlParams = new URLSearchParams(window.location.search);
const teamAbbr = urlParams.get('abbr') || 'ATL';
const teamName = urlParams.get('name') || 'Atlanta Braves';
const teamLogo = urlParams.get('logo') || '';
document.getElementById('team-name').textContent = teamName;
document.getElementById('team-logo').src = teamLogo;

createSpendingWinsChart(teamName, teamAbbr);

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
        // Clear any existing content
        d3.select("#spending-wins-chart").html("");

        // Dimensions based on container
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

        // Scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.year))
            .range([0, w]).padding(0.2);
        const yW = d3.scaleLinear()
            .domain([d3.min(data, d=>d.wins)*0.9, d3.max(data, d=>d.wins)*1.05])
            .range([h, 0]);
        const yS = d3.scaleLinear()
            .domain([d3.min(data, d=>d.spending)*0.9, d3.max(data, d=>d.spending)*1.05])
            .range([h, 0]);

        // Lines
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

        // Dots + hover
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

        // Axes
        svg.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(yW));
        svg.append("g").attr("transform",`translate(${w},0)`).call(d3.axisRight(yS));

        // Labels
        svg.append("text").attr("x", w/2).attr("y", h+40)
            .attr("text-anchor","middle").text("Year");
        svg.append("text").attr("transform","rotate(-90)")
            .attr("x",-h/2).attr("y",-45).attr("text-anchor","middle").text("Wins");
        svg.append("text").attr("transform","rotate(-90)")
            .attr("x",-h/2).attr("y",w+50).attr("text-anchor","middle").text("Spending ($M)");

        // Create legend under chart title
        const titleContainer = d3.select(".chart-title");
        const legend = titleContainer.append("div")
            .attr("class", "chart-legend-inline");

        legend.append("div")
            .attr("class", "legend-item")
            .html('<div class="legend-color" style="background:steelblue;"></div><span>Wins</span>');

        legend.append("div")
            .attr("class", "legend-item")
            .html('<div class="legend-color" style="background:green;"></div><span>Spending ($M)</span>');
    }
}
