// Set dimensions based on container
const container = document.getElementById("map-container");
const width = container.clientWidth;
const height = container.clientHeight;

// Create SVG with fixed dimensions matching container
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Create a tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.9)")
    .style("border", "1px solid #333")
    .style("border-radius", "8px")
    .style("padding", "12px")
    .style("pointer-events", "none")
    .style("font-family", "sans-serif")
    .style("font-size", "13px")
    .style("color", "white")
    .style("box-shadow", "0 4px 15px rgba(0,0,0,0.3)")
    .style("backdrop-filter", "blur(10px)");

// Set up projection to fit the US in the fixed container
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2.3])
    .scale(width * 0.9);

// Create path generator
const path = d3.geoPath().projection(projection);

// Enhanced color scheme for payroll tiers
const tierColors = {
    1: '#d62728', // Deep red for highest spenders
    2: '#ff7f0e', // Orange
    3: '#ffbb78', // Light orange
    4: '#98df8a', // Light green
    5: '#2ca02c', // Green
    6: '#1f77b4'  // Blue for lowest spenders
};

// Create a gradient definition for enhanced visuals
const defs = svg.append("defs");

// Create gradients for each tier
Object.keys(tierColors).forEach(tier => {
    const gradient = defs.append("linearGradient")
        .attr("id", `gradient-tier-${tier}`)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "100%");
    
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", tierColors[tier])
        .attr("stop-opacity", 0.3);
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", tierColors[tier])
        .attr("stop-opacity", 0.1);
});

// MLB team data with coordinates, logos, divisions, and leagues
const mlbTeams = [
    {name: "Arizona Diamondbacks", abbreviation: "ARI", lat: 33.4453, lng: -112.0667, logo: "logos/dbacks.png", division: "NL West", league: "NL", state: "Arizona"},
    {name: "Atlanta Braves", abbreviation: "ATL", lat: 33.7348, lng: -84.3898, logo: "logos/braves.png", division: "NL East", league: "NL", state: "Georgia"},
    {name: "Baltimore Orioles", abbreviation: "BAL", lat: 39.2839, lng: -77.9217, logo: "logos/orioles.png", division: "AL East", league: "AL", state: "Maryland"},
    {name: "Boston Red Sox", abbreviation: "BOS", lat: 42.3467, lng: -70.0972, logo: "logos/bosox.png", division: "AL East", league: "AL", state: "Massachusetts"},
    {name: "Chicago Cubs", abbreviation: "CHC", lat: 41.9484, lng: -87.6553, logo: "logos/cubs.png", division: "NL Central", league: "NL", state: "Illinois"},
    {name: "Chicago White Sox", abbreviation: "CHW", lat: 39.43, lng: -88.6338, logo: "logos/sox.png", division: "AL Central", league: "AL", state: "Illinois"},
    {name: "Cincinnati Reds", abbreviation: "CIN", lat: 39.0975, lng: -84.5066, logo: "logos/reds.png", division: "NL Central", league: "NL", state: "Ohio"},
    {name: "Cleveland Guardians", abbreviation: "CLE", lat: 41.4962, lng: -82.6852, logo: "logos/guardians.png", division: "AL Central", league: "AL", state: "Ohio"},
    {name: "Colorado Rockies", abbreviation: "COL", lat: 39.7561, lng: -104.9941, logo: "logos/rockies.png", division: "NL West", league: "NL", state: "Colorado"},
    {name: "Detroit Tigers", abbreviation: "DET", lat: 43.3391, lng: -84.5486, logo: "logos/tigers.png", division: "AL Central", league: "AL", state: "Michigan"},
    {name: "Houston Astros", abbreviation: "HOU", lat: 29.7572, lng: -95.3556, logo: "logos/cheaters.png", division: "AL West", league: "AL", state: "Texas"},
    {name: "Kansas City Royals", abbreviation: "KC", lat: 39.0516, lng: -94.9906, logo: "logos/royals.png", division: "AL Central", league: "AL", state: "Missouri"},
    {name: "Los Angeles Angels", abbreviation: "LAA", lat: 34.9003, lng: -116.8827, logo: "logos/angels.png", division: "AL West", league: "AL", state: "California"},
    {name: "Los Angeles Dodgers", abbreviation: "LAD", lat: 34.9739, lng: -119.94, logo: "logos/dodgers.png", division: "NL West", league: "NL", state: "California"},
    {name: "Miami Marlins", abbreviation: "MIA", lat: 25.7781, lng: -80.2196, logo: "logos/marlins.png", division: "NL East", league: "NL", state: "Florida"},
    {name: "Milwaukee Brewers", abbreviation: "MIL", lat: 44.0281, lng: -88.9713, logo: "logos/brewers.png", division: "NL Central", league: "NL", state: "Wisconsin"},
    {name: "Minnesota Twins", abbreviation: "MIN", lat: 44.9817, lng: -94.2774, logo: "logos/twins.png", division: "AL Central", league: "AL", state: "Minnesota"},
    {name: "New York Mets", abbreviation: "NYM", lat: 42.7571, lng: -75.2458, logo: "logos/mets.png", division: "NL East", league: "NL", state: "New York"},
    {name: "New York Yankees", abbreviation: "NYY", lat: 41.2296, lng: -72.9262, logo: "logos/yankees.png", division: "AL East", league: "AL", state: "New York"},
    {name: "Oakland Athletics", abbreviation: "OAK", lat: 39.7516, lng: -122.005, logo: "logos/athletics.png", division: "AL West", league: "AL", state: "California"},
    {name: "Philadelphia Phillies", abbreviation: "PHI", lat: 39.9059, lng: -75.1665, logo: "logos/phillies.png", division: "NL East", league: "NL", state: "Pennsylvania"},
    {name: "Pittsburgh Pirates", abbreviation: "PIT", lat: 40.4469, lng: -80.0058, logo: "logos/pirates.png", division: "NL Central", league: "NL", state: "Pennsylvania"},
    {name: "San Diego Padres", abbreviation: "SD", lat: 32.7076, lng: -117.1569, logo: "logos/padres.png", division: "NL West", league: "NL", state: "California"},
    {name: "San Francisco Giants", abbreviation: "SF", lat: 37.2786, lng: -122.4093, logo: "logos/giants.png", division: "NL West", league: "NL", state: "California"},
    {name: "Seattle Mariners", abbreviation: "SEA", lat: 47.5913, lng: -122.3325, logo: "logos/mariners.png", division: "AL West", league: "AL", state: "Washington"},
    {name: "St. Louis Cardinals", abbreviation: "STL", lat: 38.6226, lng: -91.1928, logo: "logos/cards.png", division: "NL Central", league: "NL", state: "Missouri"},
    {name: "Tampa Bay Rays", abbreviation: "TB", lat: 27.7682, lng: -82.6534, logo: "logos/rays.png", division: "AL East", league: "AL", state: "Florida"},
    {name: "Texas Rangers", abbreviation: "TEX", lat: 32.7511, lng: -97.0824, logo: "logos/rangers.png", division: "AL West", league: "AL", state: "Texas"},
    {name: "Toronto Blue Jays", abbreviation: "TOR", lat: 47.6415, lng: -79.3891, logo: "logos/jays.png", division: "AL East", league: "AL", state: "Ontario"},
    {name: "Washington Nationals", abbreviation: "WSH", lat: 36.873, lng: -77.0074, logo: "logos/nats.png", division: "NL East", league: "NL", state: "Virginia"}
];

// State name mapping for the GeoJSON data
const stateNameMapping = {
    "Arizona": "04", "Georgia": "13", "Maryland": "24", "Massachusetts": "25", 
    "Illinois": "17", "Ohio": "39", "Colorado": "08", "Michigan": "26",
    "Texas": "48", "Missouri": "29", "California": "06", "Florida": "12",
    "Wisconsin": "55", "Minnesota": "27", "New York": "36", "Pennsylvania": "42",
    "Washington": "53", "Virginia": "51", "Ontario": null // Canada
};

// Function to animate team logos (simplified)
function animateTeamLogos() {
    console.log("Animating team logos...");
    
    // Simple fade-in animation for all logos
    svg.selectAll(".team-logo")
        .transition()
        .duration(1000)
        .attr("opacity", 1);
}

// Make function globally accessible
window.animateTeamLogos = animateTeamLogos;

// Function to get state color based on teams in that state
function getStateColor(stateName, teams) {
    const teamsInState = teams.filter(team => team.state === stateName);
    if (teamsInState.length === 0) return '#f8f9fa'; // Light gray for states without teams
    
    // If multiple teams, use average tier
    const avgTier = d3.mean(teamsInState, d => d.payTier);
    const roundedTier = Math.round(avgTier);
    return tierColors[roundedTier] || '#f8f9fa';
}

// Function to apply filters
function applyFilters() {
    const selectedLeagues = Array.from(document.querySelectorAll('.league-filter:checked')).map(el => el.value);
    const selectedDivisions = Array.from(document.querySelectorAll('.division-filter:checked')).map(el => el.value);
    const selectedPayTiers = Array.from(document.querySelectorAll('.pay-tier-filter:checked')).map(el => parseInt(el.value));

    // Only toggle logos
    svg.selectAll(".team-logo")
        .each(function(d) {
            const team = d;
            const teamPayTier = team.payTier || 1;

            const leagueMatch = selectedLeagues.includes(team.league);
            const divisionMatch = selectedDivisions.includes(team.division);
            const payTierMatch = selectedPayTiers.includes(teamPayTier);

            const shouldShow = leagueMatch && divisionMatch && payTierMatch;

            d3.select(this)
            .style("display", shouldShow ? "block" : "none");
        });

}

//set up buttons
function setupSelectAllButtons() {
    document.querySelectorAll('.select-all').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const filterType = this.getAttribute('data-filter');
            const checkboxes = document.querySelectorAll(`.${filterType}-filter`);

            const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);

            checkboxes.forEach(cb => {
                cb.checked = anyUnchecked;
            });

            applyFilters();
        });
    });
}

//payroll tiers
function addMapLegend() {
    const legendHtml = `
        <div class="map-legend">
            <h3>Payroll Tiers</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color tier-1"></div>
                    <span>Tier 1: Top 5 Spenders ($200M+)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color tier-2"></div>
                    <span>Tier 2: High Spenders ($150-200M)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color tier-3"></div>
                    <span>Tier 3: Above Average ($120-150M)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color tier-4"></div>
                    <span>Tier 4: Below Average ($90-120M)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color tier-5"></div>
                    <span>Tier 5: Low Spenders ($70-90M)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color tier-6"></div>
                    <span>Tier 6: Bottom 5 (&lt;$70M)</span>
                </div>
            </div>
            <div class="legend-note">
                <small>States colored by team payroll tiers. Click team logos to explore!</small>
            </div>
        </div>
    `;
    
    document.getElementById('map-container').insertAdjacentHTML('beforeend', legendHtml);
}

// Process the data from winspay.csv
d3.csv("winspay.csv").then(data => {
    console.log("Raw CSV data:", data);
    console.log("CSV headers:", Object.keys(data[0] || {}));

    const validData = data.filter(d => d.Team && d["Avg. Wins"] && d["Avg. Total Payroll Allocation"]);
    console.log("Valid data rows:", validData.length);

    const teamStats = {};

    validData.forEach(d => {
        const teamAbbr = d.Team.trim();
        if (!teamAbbr) return;

        const avgWins = parseFloat(d["Avg. Wins"]);
        const avgPayroll = parseFloat(d["Avg. Total Payroll Allocation"].replace(/[$,"\s]/g, ''));

        teamStats[teamAbbr] = {
            avgWins: avgWins.toFixed(1),
            avgPayroll: avgPayroll
        };
    });

    // Merge data with teams
    mlbTeams.forEach(team => {
        const stats = teamStats[team.abbreviation];
        team.avgWins = stats ? stats.avgWins : "Data Missing";
        team.avgPayroll = stats
            ? `$${Number(stats.avgPayroll).toLocaleString("en-US")}`
            : "Data Missing";
        team.rawPayroll = stats ? stats.avgPayroll : 0;
    });

    // Sort teams by payroll and assign tiers
    mlbTeams.sort((a, b) => b.rawPayroll - a.rawPayroll);
    mlbTeams.forEach((team, index) => {
        team.payTier = Math.min(Math.floor(index / 5) + 1, 6);
    });

    // Load and draw the US map
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        .then(us => {
            // Draw states with colors
            svg.append("g")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .enter()
                .append("path")
                .attr("class", "state")
                .attr("d", path)
                .attr("fill", function(d) {
                    const stateName = d.properties.name;
                    return getStateColor(stateName, mlbTeams);
                })
                .attr("stroke", "#666")
                .attr("stroke-width", 1)
                .style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    const stateName = d.properties.name;
                    const teamsInState = mlbTeams.filter(team => team.state === stateName);
                    
                    if (teamsInState.length > 0) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("stroke-width", 2)
                            .attr("stroke", "#333");
                            
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        
                        const tooltipContent = `
                            <strong>${stateName}</strong><br>
                            Teams: ${teamsInState.map(t => t.abbreviation).join(", ")}<br>
                            ${teamsInState.length > 1 ? 'Average ' : ''}Payroll Tier: ${d3.mean(teamsInState, t => t.payTier).toFixed(1)}
                        `;
                        
                        tooltip.html(tooltipContent)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    }
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("stroke-width", 1)
                        .attr("stroke", "#666");
                        
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Add team logos with enhanced interactions
            svg.selectAll(".team-logo")
                .data(mlbTeams)
                .enter()
                .append("image")
                .attr("class", "team-logo")
                .attr("xlink:href", d => d.logo)
                .attr("width", 50)
                .attr("height", 50)
                .attr("data-tier", d => d.payTier)
                .attr("x", d => {
                    const coords = projection([d.lng, d.lat]);
                    return coords ? coords[0] - 25 : 0;
                })
                .attr("y", d => {
                    const coords = projection([d.lng, d.lat]);
                    return coords ? coords[1] - 25 : 0;
                })
                .attr("opacity", 1)
                .style("cursor", "pointer")
                .style("filter", d => `drop-shadow(0 0 8px ${tierColors[d.payTier]})`)
                .on("mouseover", function(event, d) {
                    if (d3.select(this).classed("hidden")) return;

                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("width", 70)
                        .attr("height", 70)
                        .attr("x", function(d) {
                            const coords = projection([d.lng, d.lat]);
                            return coords ? coords[0] - 35 : 0;
                        })
                        .attr("y", function(d) {
                            const coords = projection([d.lng, d.lat]);
                            return coords ? coords[1] - 35 : 0;
                        })
                        .style("filter", d => `drop-shadow(0 0 15px ${tierColors[d.payTier]})`);

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .95);
                    
                    const efficiencyRating = d.rawPayroll > 0 ? (parseFloat(d.avgWins) / (d.rawPayroll / 1000000)).toFixed(2) : 'N/A';
                    
                    tooltip.html(`
                        <div style="text-align: center;">
                            <strong style="font-size: 16px; color: ${tierColors[d.payTier]};">${d.name}</strong><br>
                            <span style="font-size: 12px; opacity: 0.8;">${d.division}</span>
                        </div>
                        <hr style="margin: 8px 0; border-color: #555;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
                            <div>
                                <div style="font-size: 11px; opacity: 0.7;">Average Wins</div>
                                <div style="font-size: 18px; font-weight: bold; color: #60a5fa;">${d.avgWins}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; opacity: 0.7;">Payroll</div>
                                <div style="font-size: 14px; font-weight: bold; color: #FFD700;">${d.avgPayroll}</div>
                            </div>
                        </div>
                        <div style="margin-top: 8px;">
                            <div style="font-size: 11px; opacity: 0.7;">Efficiency (Wins per $M)</div>
                            <div style="font-size: 16px; font-weight: bold; color: ${efficiencyRating > 0.8 ? '#22c55e' : efficiencyRating > 0.5 ? '#f59e0b' : '#ef4444'};">${efficiencyRating}</div>
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #555;">
                            <div style="font-size: 11px; opacity: 0.7;">Payroll Tier</div>
                            <span style="background: ${tierColors[d.payTier]}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold;">${d.payTier} of 6</span>
                        </div>
                        <div style="margin-top: 8px; text-align: center;">
                            <em style="font-size: 11px; opacity: 0.6;">Click to explore detailed stats →</em>
                        </div>
                    `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("width", 50)
                        .attr("height", 50)
                        .attr("x", function(d) {
                            const coords = projection([d.lng, d.lat]);
                            return coords ? coords[0] - 25 : 0;
                        })
                        .attr("y", function(d) {
                            const coords = projection([d.lng, d.lat]);
                            return coords ? coords[1] - 25 : 0;
                        })
                        .style("filter", d => `drop-shadow(0 0 8px ${tierColors[d.payTier]})`);

                    tooltip.transition()
                        .duration(300)
                        .style("opacity", 0);
                })
                .on("click", function(event, d) {
                    event.stopPropagation();
                    
                    // Add click animation
                    d3.select(this)
                        .transition()
                        .duration(100)
                        .attr("width", 80)
                        .attr("height", 80)
                        .transition()
                        .duration(100)
                        .attr("width", 50)
                        .attr("height", 50);
                    
                    // Navigate to team page
                    const params = new URLSearchParams();
                    params.set('name', d.name);
                    params.set('abbr', d.abbreviation);
                    params.set('league', d.league);
                    params.set('division', d.division);
                    params.set('tier', d.payTier);
                    params.set('wins', d.avgWins);
                    params.set('payroll', d.avgPayroll);
                    params.set('logo', d.logo);

                    window.location.href = `team.html?${params.toString()}`;
                });

            addMapLegend();

            if (sessionStorage.getItem("introShown")) {
                // Show logos immediately if intro was already shown
                svg.selectAll(".team-logo")
                    .attr("opacity", 1);
            }

            document.querySelectorAll('.league-filter, .division-filter, .pay-tier-filter').forEach(el => {
                el.addEventListener('change', applyFilters);
            });

            setupSelectAllButtons();
            applyFilters();
        })
        .catch(error => {
            console.error("Error loading the CSV or map data:", error);
        });
});

// Team Popup Functionality
function showTeamPopup(teamData) {
    // Remove existing popup if any
    d3.select("#team-popup").remove();
    
    // Create popup overlay
    const popup = d3.select("body")
        .append("div")
        .attr("id", "team-popup")
        .style("position", "fixed")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("z-index", "10000")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("opacity", "0")
        .on("click", function(event) {
            if (event.target === this) closeTeamPopup();
        });

    // Create popup content
    const popupContent = popup
        .append("div")
        .style("background", "white")
        .style("border-radius", "15px")
        .style("padding", "30px")
        .style("max-width", "90vw")
        .style("max-height", "90vh")
        .style("overflow-y", "auto")
        .style("position", "relative")
        .style("box-shadow", "0 20px 60px rgba(0, 0, 0, 0.3)");

    // Add close button
    popupContent
        .append("button")
        .style("position", "absolute")
        .style("top", "15px")
        .style("right", "15px")
        .style("background", "none")
        .style("border", "none")
        .style("font-size", "24px")
        .style("cursor", "pointer")
        .style("color", "#666")
        .text("×")
        .on("click", closeTeamPopup);

    // Add team header
    const header = popupContent
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "30px")
        .style("padding-bottom", "20px")
        .style("border-bottom", "2px solid #eee");

    header.append("img")
        .attr("src", teamData.logo)
        .style("width", "60px")
        .style("height", "60px")
        .style("margin-right", "20px");

    const headerText = header.append("div");
    
    headerText.append("h2")
        .text(teamData.name)
        .style("margin", "0")
        .style("color", "#333")
        .style("font-size", "24px");

    headerText.append("p")
        .text(`${teamData.division} • Tier ${teamData.payTier} Payroll`)
        .style("margin", "5px 0 0 0")
        .style("color", "#666")
        .style("font-size", "14px");

    // Create charts container
    const chartsContainer = popupContent
        .append("div")
        .style("display", "grid")
        .style("grid-template-columns", "1fr 1fr")
        .style("grid-template-rows", "300px 300px")
        .style("gap", "20px")
        .style("width", "800px");

    // Chart 1: Team Stats Summary (Top Left)
    createStatsChart(chartsContainer, teamData);
    
    // Chart 2: Interactive Efficiency Over Time (Top Right)
    createInteractiveEfficiencyChart(chartsContainer, teamData);
    
    // Chart 3: Division Comparison (Bottom, spans both columns)
    const fullWidthContainer = popupContent
        .append("div")
        .style("margin-top", "20px")
        .style("width", "800px")
        .style("height", "300px");
    
    createDivisionComparisonChart(fullWidthContainer, teamData);

    // Animate popup in
    popup.transition()
        .duration(300)
        .style("opacity", "1");
}

function closeTeamPopup() {
    d3.select("#team-popup")
        .transition()
        .duration(200)
        .style("opacity", "0")
        .remove();
}

// Chart 1: Team Stats Summary
function createStatsChart(container, teamData) {
    const chartDiv = container
        .append("div")
        .style("background", "#f8f9fa")
        .style("border-radius", "10px")
        .style("padding", "20px")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center");

    chartDiv.append("h3")
        .text("Team Overview")
        .style("margin", "0 0 20px 0")
        .style("text-align", "center")
        .style("color", "#333");

    const stats = [
        { label: "Average Wins", value: teamData.avgWins, color: "#1f77b4" },
        { label: "Average Payroll", value: teamData.avgPayroll, color: "#2ca02c" },
        { label: "Payroll Tier", value: `${teamData.payTier} of 6`, color: tierColors[teamData.payTier] },
        { label: "League", value: teamData.league, color: "#ff7f0e" },
        { label: "Division", value: teamData.division, color: "#d62728" }
    ];

    stats.forEach(stat => {
        const statRow = chartDiv
            .append("div")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("align-items", "center")
            .style("margin", "10px 0")
            .style("padding", "10px")
            .style("background", "white")
            .style("border-radius", "8px")
            .style("border-left", `4px solid ${stat.color}`);

        statRow.append("span")
            .text(stat.label)
            .style("font-weight", "500")
            .style("color", "#333");

        statRow.append("span")
            .text(stat.value)
            .style("font-weight", "bold")
            .style("color", stat.color);
    });
}

// Chart 2: Interactive Efficiency Over Time
function createInteractiveEfficiencyChart(container, teamData) {
    const chartDiv = container
        .append("div")
        .style("background", "#f8f9fa")
        .style("border-radius", "10px")
        .style("padding", "20px");

    chartDiv.append("h3")
        .text("Spending Efficiency Trend")
        .style("margin", "0 0 15px 0")
        .style("text-align", "center")
        .style("color", "#333");

    // Load team-specific data for the interactive chart
    fetch("Spend vs Wins_data.csv")
        .then(res => res.arrayBuffer())
        .then(buf => new TextDecoder('utf-16le').decode(buf))
        .then(text => d3.tsvParse(text))
        .then(data => {
            const norm = s => s?.trim().toLowerCase();
            const teamDataFiltered = data.filter(d =>
                norm(d.Team) === norm(teamData.abbreviation) ||
                norm(d["Team Name"]) === norm(teamData.name)
            );

            if (!teamDataFiltered.length) {
                chartDiv.append("p")
                    .text("No historical data available")
                    .style("text-align", "center")
                    .style("color", "#666");
                return;
            }

            const chartData = teamDataFiltered.map(d => ({
                year: +d.Year,
                wins: +d.Wins,
                spending: +d["Avg. Total Payroll Allocation"].replace(/[$,]/g, '') / 1e6,
                efficiency: +d.Wins / (+d["Avg. Total Payroll Allocation"].replace(/[$,]/g, '') / 1e6)
            })).sort((a, b) => a.year - b.year);

            renderInteractiveEfficiencyChart(chartDiv, chartData);
        })
        .catch(err => {
            chartDiv.append("p")
                .text("Error loading data")
                .style("text-align", "center")
                .style("color", "#d62728");
        });
}

function renderInteractiveEfficiencyChart(container, data) {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.efficiency))
        .range([height, 0]);

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.efficiency))
        .curve(d3.curveMonotoneX);

    // Add axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d.toFixed(1)));

    // Add line
    const path = g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Add interactive dots
    const dots = g.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.efficiency))
        .attr("r", 0)
        .attr("fill", "#1f77b4")
        .style("cursor", "pointer");

    // Animate dots
    dots.transition()
        .delay((d, i) => i * 100 + 1000)
        .duration(300)
        .attr("r", 4);

    // Interactive tooltip for efficiency chart
    const tooltip = d3.select("body").append("div")
        .attr("class", "efficiency-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    dots
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("r", 6);

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

            tooltip.html(`
                <strong>${d.year}</strong><br/>
                Wins: ${d.wins}<br/>
                Spending: ${d.spending.toFixed(1)}M<br/>
                Efficiency: ${d.efficiency.toFixed(2)} wins/$M
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(100)
                .attr("r", 4);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add labels
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Wins per $M");
}

// Chart 3: Division Comparison
function createDivisionComparisonChart(container, teamData) {
    container.append("h3")
        .text(`${teamData.division} Comparison`)
        .style("margin", "0 0 20px 0")
        .style("text-align", "center")
        .style("color", "#333");

    // Get division teams
    const divisions = {
        'AL East': ['NYY', 'BOS', 'TB', 'TOR', 'BAL'],
        'AL Central': ['CHW', 'CLE', 'DET', 'KC', 'MIN'],
        'AL West': ['HOU', 'LAA', 'OAK', 'SEA', 'TEX'],
        'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
        'NL Central': ['CHC', 'CIN', 'MIL', 'PIT', 'STL'],
        'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF']
    };

    const divisionTeams = divisions[teamData.division] || [];
    const divisionData = mlbTeams.filter(team => divisionTeams.includes(team.abbreviation));

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 750 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
        .domain(divisionData.map(d => d.abbreviation))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(divisionData, d => d.rawPayroll)])
        .range([height, 0]);

    // Add axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => `${(d/1e6).toFixed(0)}M`));

    // Add bars
    const bars = g.selectAll(".bar")
        .data(divisionData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.abbreviation))
        .attr("y", height)
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", d => d.abbreviation === teamData.abbreviation ? "#FFD700" : tierColors[d.payTier])
        .attr("stroke", d => d.abbreviation === teamData.abbreviation ? "#FF8C00" : "none")
        .attr("stroke-width", 2);

    // Animate bars
    bars.transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr("y", d => yScale(d.rawPayroll))
        .attr("height", d => height - yScale(d.rawPayroll));

    // Add labels
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Team");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Payroll");
}

// Handle window resize with smooth transitions
window.addEventListener("resize", function() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    svg.transition()
        .duration(500)
        .attr("width", newWidth)
        .attr("height", newHeight);

    projection.scale(newWidth * 0.9)
        .translate([newWidth / 2, newHeight / 2]);

    svg.selectAll(".state")
        .transition()
        .duration(500)
        .attr("d", path);

    svg.selectAll(".team-logo")
        .transition()
        .duration(500)
        .attr("x", d => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[0] - 25 : 0;
        })
        .attr("y", d => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[1] - 25 : 0;
        });
});


// Enhanced intro animation script
document.addEventListener("DOMContentLoaded", () => {
    const introScreen = document.getElementById("intro-screen");

    // If intro has already been shown this session, skip it
    if (sessionStorage.getItem("introShown")) {
        introScreen.remove();
        setTimeout(() => {
            if (typeof animateTeamLogos === 'function') {
                animateTeamLogos();
            }
        }, 100);
        return;
    }

    const slides = document.querySelectorAll('.intro-slide');
    const progressFill = document.getElementById('progress-fill');
    const exploreBtn = document.getElementById('explore-btn');
    const moneyRain = document.getElementById('money-rain');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    const slideDuration = 5000; // 5 seconds per slide
    let slideTimeout;
    
    // Create money rain effect
    function createMoneyRain() {
        const symbols = ['$', '💰', '💸', '💵'];
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const dollar = document.createElement('div');
                dollar.className = 'dollar-bill';
                dollar.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                dollar.style.left = Math.random() * 100 + '%';
                dollar.style.animationDuration = (Math.random() * 3 + 4) + 's';
                dollar.style.animationDelay = Math.random() * 2 + 's';
                moneyRain.appendChild(dollar);
                
                // Remove after animation
                setTimeout(() => {
                    if (dollar.parentNode) {
                        dollar.parentNode.removeChild(dollar);
                    }
                }, 8000);
            }, i * 200);
        }
    }
    
    // Function to show a slide
    function showSlide(index) {
        // Clear any existing timeout
        if (slideTimeout) clearTimeout(slideTimeout);
        
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('show'));
        
        // Show current slide
        if (slides[index]) {
            slides[index].classList.add('show');
            
            // Special animations for specific slides
            if (index === 0) {
                // Start money rain on first slide
                createMoneyRain();
                setInterval(createMoneyRain, 8000);
            }
            
            if (index === 2) {
                // Animate salary bars
                setTimeout(() => {
                    document.getElementById('salary-low').classList.add('animate');
                }, 1000);
                setTimeout(() => {
                    document.getElementById('salary-high').classList.add('animate');
                }, 2000);
            }
            
            if (index === 3) {
                // Animate team cards
                setTimeout(() => {
                    document.getElementById('athletics-card').classList.add('show');
                }, 800);
                setTimeout(() => {
                    document.getElementById('dodgers-card').classList.add('show');
                }, 1500);
            }
            
            if (index === 6) {
                // Show explore button
                setTimeout(() => {
                    exploreBtn.classList.add('show');
                }, 2000);
            }
        }
        
        // Update progress bar
        const progress = ((index + 1) / totalSlides) * 100;
        progressFill.style.width = progress + '%';
        
        // Set timeout for next slide (except last slide)
        if (index < totalSlides - 1) {
            slideTimeout = setTimeout(() => {
                currentSlide++;
                showSlide(currentSlide);
            }, slideDuration);
        }
    }
    
    // Start the slideshow
    showSlide(0);
    
    // Handle explore button click
    exploreBtn.addEventListener('click', () => {
        introScreen.style.transition = 'opacity 1.5s ease';
        introScreen.style.opacity = '0';
        
        setTimeout(() => {
            introScreen.remove();
            sessionStorage.setItem('introShown', 'true');
            setTimeout(() => {
                if (typeof animateTeamLogos === 'function') {
                    animateTeamLogos();
                }
            }, 100);
        }, 1500);
    });
    
    // Skip intro on keypress
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === ' ') {
            if (slideTimeout) clearTimeout(slideTimeout);
            currentSlide = totalSlides - 1;
            showSlide(currentSlide);
        }
    });
    
    // Allow clicking to advance slides
    document.addEventListener('click', (e) => {
        if (e.target !== exploreBtn && currentSlide < totalSlides - 1) {
            if (slideTimeout) clearTimeout(slideTimeout);
            currentSlide++;
            showSlide(currentSlide);
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const dropdown = document.querySelector('.dropdown');
    const button = dropdown.querySelector('.dropdown-btn');
    const content = dropdown.querySelector('.dropdown-content');

    let isHovered = false;

    // Toggle on click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Stay open when hovered
    dropdown.addEventListener('mouseenter', () => {
        isHovered = true;
        dropdown.classList.add('show');
    });

    dropdown.addEventListener('mouseleave', () => {
        isHovered = false;
        // Delay hiding to allow mouse to move between elements
        setTimeout(() => {
            if (!isHovered) dropdown.classList.remove('show');
        }, 200);
    });

    // Close when clicking outside
    document.addEventListener('click', () => {
        if (!isHovered) dropdown.classList.remove('show');
    });

    // Prevent closing when clicking inside content
    content.addEventListener('click', e => e.stopPropagation());
});

document.getElementById('help-btn').addEventListener('click', () => {
    const box = document.getElementById('help-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  });
  

