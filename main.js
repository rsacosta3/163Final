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
    .style("background", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("pointer-events", "none")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("box-shadow", "0 0 5px rgba(0,0,0,0.2)");

// Set up projection to fit the US in the fixed container
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width * 0.9); // Adjusted scale for better fit

// Create path generator
const path = d3.geoPath().projection(projection);

// MLB team data with coordinates, logos, divisions, and leagues
const mlbTeams = [
    {name: "Arizona Diamondbacks", abbreviation: "ARI", lat: 33.4453, lng: -112.0667, logo: "logos/dbacks.png", division: "NL West", league: "NL"},
    {name: "Atlanta Braves", abbreviation: "ATL", lat: 33.7348, lng: -84.3898, logo: "logos/braves.png", division: "NL East", league: "NL"},
    {name: "Baltimore Orioles", abbreviation: "BAL", lat: 39.2839, lng: -77.9217, logo: "logos/orioles.png", division: "AL East", league: "AL"},
    {name: "Boston Red Sox", abbreviation: "BOS", lat: 42.3467, lng: -70.0972, logo: "logos/bosox.png", division: "AL East", league: "AL"},
    {name: "Chicago Cubs", abbreviation: "CHC", lat: 41.9484, lng: -87.6553, logo: "logos/cubs.png", division: "NL Central", league: "NL"},
    {name: "Chicago White Sox", abbreviation: "CHW", lat: 39.43, lng: -88.6338, logo: "logos/sox.png", division: "AL Central", league: "AL"},
    {name: "Cincinnati Reds", abbreviation: "CIN", lat: 39.0975, lng: -84.5066, logo: "logos/reds.png", division: "NL Central", league: "NL"},
    {name: "Cleveland Guardians", abbreviation: "CLE", lat: 41.4962, lng: -82.6852, logo: "logos/guardians.png", division: "AL Central", league: "AL"},
    {name: "Colorado Rockies", abbreviation: "COL", lat: 39.7561, lng: -104.9941, logo: "logos/rockies.png", division: "NL West", league: "NL"},
    {name: "Detroit Tigers", abbreviation: "DET", lat: 43.3391, lng: -84.5486, logo: "logos/tigers.png", division: "AL Central", league: "AL"},
    {name: "Houston Astros", abbreviation: "HOU", lat: 29.7572, lng: -95.3556, logo: "logos/cheaters.png", division: "AL West", league: "AL"},
    {name: "Kansas City Royals", abbreviation: "KC", lat: 39.0516, lng: -94.9906, logo: "logos/royals.png", division: "AL Central", league: "AL"},
    {name: "Los Angeles Angels", abbreviation: "LAA", lat: 34.9003, lng: -116.8827, logo: "logos/angels.png", division: "AL West", league: "AL"},
    {name: "Los Angeles Dodgers", abbreviation: "LAD", lat: 34.9739, lng: -119.94, logo: "logos/dodgers.png", division: "NL West", league: "NL"},
    {name: "Miami Marlins", abbreviation: "MIA", lat: 25.7781, lng: -80.2196, logo: "logos/marlins.png", division: "NL East", league: "NL"},
    {name: "Milwaukee Brewers", abbreviation: "MIL", lat: 44.0281, lng: -88.9713, logo: "logos/brewers.png", division: "NL Central", league: "NL"},
    {name: "Minnesota Twins", abbreviation: "MIN", lat: 44.9817, lng: -94.2774, logo: "logos/twins.png", division: "AL Central", league: "AL"},
    {name: "New York Mets", abbreviation: "NYM", lat: 42.7571, lng: -75.2458, logo: "logos/mets.png", division: "NL East", league: "NL"},
    {name: "New York Yankees", abbreviation: "NYY", lat: 41.2296, lng: -72.9262, logo: "logos/yankees.png", division: "AL East", league: "AL"},
    {name: "Oakland Athletics", abbreviation: "OAK", lat: 39.7516, lng: -122.005, logo: "logos/athletics.png", division: "AL West", league: "AL"},
    {name: "Philadelphia Phillies", abbreviation: "PHI", lat: 39.9059, lng: -75.1665, logo: "logos/phillies.png", division: "NL East", league: "NL"},
    {name: "Pittsburgh Pirates", abbreviation: "PIT", lat: 40.4469, lng: -80.0058, logo: "logos/pirates.png", division: "NL Central", league: "NL"},
    {name: "San Diego Padres", abbreviation: "SD", lat: 32.7076, lng: -117.1569, logo: "logos/padres.png", division: "NL West", league: "NL"},
    {name: "San Francisco Giants", abbreviation: "SF", lat: 37.2786, lng: -122.4093, logo: "logos/giants.png", division: "NL West", league: "NL"},
    {name: "Seattle Mariners", abbreviation: "SEA", lat: 47.5913, lng: -122.3325, logo: "logos/mariners.png", division: "AL West", league: "AL"},
    {name: "St. Louis Cardinals", abbreviation: "STL", lat: 38.6226, lng: -91.1928, logo: "logos/cards.png", division: "NL Central", league: "NL"},
    {name: "Tampa Bay Rays", abbreviation: "TB", lat: 27.7682, lng: -82.6534, logo: "logos/rays.png", division: "AL East", league: "AL"},
    {name: "Texas Rangers", abbreviation: "TEX", lat: 32.7511, lng: -97.0824, logo: "logos/rangers.png", division: "AL West", league: "AL"},
    {name: "Toronto Blue Jays", abbreviation: "TOR", lat: 47.6415, lng: -79.3891, logo: "logos/jays.png", division: "AL East", league: "AL"},
    {name: "Washington Nationals", abbreviation: "WSH", lat: 36.873, lng: -77.0074, logo: "logos/nats.png", division: "NL East", league: "NL"}
];

// Function to apply filters
function applyFilters() {
    // Get selected filters
    const selectedLeagues = Array.from(document.querySelectorAll('.league-filter:checked')).map(el => el.value);
    const selectedDivisions = Array.from(document.querySelectorAll('.division-filter:checked')).map(el => el.value);
    const selectedPayTiers = Array.from(document.querySelectorAll('.pay-tier-filter:checked')).map(el => parseInt(el.value));

    // Filter teams
    svg.selectAll(".team-logo")
        .each(function(d) {
            const team = d;
            const teamPayTier = team.payTier || 1; // Default to tier 1 if not set

            const leagueMatch = selectedLeagues.includes(team.league);
            const divisionMatch = selectedDivisions.includes(team.division);
            const payTierMatch = selectedPayTiers.includes(teamPayTier);

            const shouldShow = leagueMatch && divisionMatch && payTierMatch;

            d3.select(this)
                .classed("hidden", !shouldShow)
                .style("pointer-events", shouldShow ? "all" : "none");
        });
}

// Add this function to handle "Select All" button clicks
function setupSelectAllButtons() {
    document.querySelectorAll('.select-all').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const filterType = this.getAttribute('data-filter');
            const checkboxes = document.querySelectorAll(`.${filterType}-filter`);

            // Check if any are unchecked
            const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);

            // Set all to match the "anyUnchecked" state (if any are unchecked, check all)
            checkboxes.forEach(cb => {
                cb.checked = anyUnchecked;
            });

            // Apply the filters
            applyFilters();
        });
    });
}

// Process the data from winspay.csv
d3.csv("winspay.csv").then(data => {
    console.log("Raw CSV data:", data);
    console.log("CSV headers:", Object.keys(data[0] || {}));

    // Filter out empty rows and ensure we have valid data
    const validData = data.filter(d => d.Team && d["Avg. Wins"] && d["Avg. Total Payroll Allocation"]);
    console.log("Valid data rows:", validData.length);

    // Create a lookup object for team stats
    const teamStats = {};

    validData.forEach(d => {
        const teamAbbr = d.Team.trim();
        if (!teamAbbr) return;

        console.log(`Processing team: ${teamAbbr}`);
        console.log(`Raw wins: "${d["Avg. Wins"]}"`);
        console.log(`Raw payroll: "${d["Avg. Total Payroll Allocation"]}"`);

        // Clean and parse the values
        const avgWins = parseFloat(d["Avg. Wins"]);
        const avgPayroll = parseFloat(d["Avg. Total Payroll Allocation"].replace(/[$,"\s]/g, ''));

        console.log(`Parsed wins: ${avgWins}`);
        console.log(`Parsed payroll: ${avgPayroll}`);

        teamStats[teamAbbr] = {
            avgWins: avgWins.toFixed(1),
            avgPayroll: avgPayroll
        };
    });

    console.log("Team stats lookup:", teamStats);

    // Merge this data with our mlbTeams array
    mlbTeams.forEach(team => {
        const stats = teamStats[team.abbreviation];
        console.log(`Looking up ${team.abbreviation}:`, stats);

        team.avgWins = stats ? stats.avgWins : "Data Missing";
        team.avgPayroll = stats
            ? `$${Number(stats.avgPayroll).toLocaleString("en-US")}`
            : "Data Missing";
        team.rawPayroll = stats ? stats.avgPayroll : 0;
    });

    // Sort teams by payroll and assign pay tiers (5 teams per tier, 6 tiers total)
    mlbTeams.sort((a, b) => b.rawPayroll - a.rawPayroll);
    mlbTeams.forEach((team, index) => {
        team.payTier = Math.min(Math.floor(index / 5) + 1, 6); // Ensure we don't go beyond tier 6
    });

    // Load and draw the US map
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        .then(us => {
            // Draw states
            svg.append("g")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .enter()
                .append("path")
                .attr("class", "state")
                .attr("d", path);

            // Add team logos with tooltips
            svg.selectAll(".team-logo")
                .data(mlbTeams)
                .enter()
                .append("image")
                .attr("class", "team-logo")
                .attr("xlink:href", d => d.logo)
                .attr("width", 40)
                .attr("height", 40)
                .attr("x", d => {
                    const coords = projection([d.lng, d.lat]);
                    return coords ? coords[0] - 20 : 0;
                })
                .attr("y", d => {
                    const coords = projection([d.lng, d.lat]);
                    return coords ? coords[1] - 20 : 0;
                })
                .attr("opacity", 0)
                .style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    if (d3.select(this).classed("hidden")) return;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`
        <strong>${d.name}</strong><br>
        Avg Wins: ${d.avgWins}<br>
        Avg Payroll: ${d.avgPayroll}<br>
        Division: ${d.division}<br>
        Payroll Tier: ${d.payTier} of 6<br>
        <em>Click the Team Icon to Explore More</em>
    `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", function(event, d) {
                    event.stopPropagation();
                    // Encode team data as URL parameters
                    const params = new URLSearchParams();
                    params.set('name', d.name);
                    params.set('abbr', d.abbreviation);
                    params.set('league', d.league);
                    params.set('division', d.division);
                    params.set('tier', d.payTier);
                    params.set('wins', d.avgWins);
                    params.set('payroll', d.avgPayroll);
                    params.set('logo', d.logo);

                    // Navigate to the team page with parameters
                    window.location.href = `team.html?${params.toString()}`;
                })
            // First hide all logos initially
            svg.selectAll(".team-logo")
                .attr("opacity", 0);

// Group teams by their pay tier
            const teamsByTier = {};
            mlbTeams.forEach(team => {
                if (!teamsByTier[team.payTier]) {
                    teamsByTier[team.payTier] = [];
                }
                teamsByTier[team.payTier].push(team);
            });

// Animate each tier sequentially
            Object.keys(teamsByTier).sort().forEach((tier, tierIndex) => {
                const delay = tierIndex * 500; // 500ms between tiers

                teamsByTier[tier].forEach((team, teamIndex) => {
                    svg.selectAll(".team-logo")
                        .filter(d => d.name === team.name)
                        .transition()
                        .delay(delay + (teamIndex * 100)) // Small stagger within tiers
                        .duration(800)
                        .attr("opacity", 1);
                });
            });

            // Set up filter event listeners
            document.querySelectorAll('.league-filter, .division-filter, .pay-tier-filter').forEach(el => {
                el.addEventListener('change', applyFilters);
            });

            // Set up select all buttons
            setupSelectAllButtons();

            // Apply initial filters
            applyFilters();
        })
        .catch(error => {
            console.error("Error loading the CSV or map data:", error);
        });
});

// Function to create and show team page
function showTeamPage(team) {
    // Create overlay container
    const overlay = d3.select("body").append("div")
        .attr("class", "team-overlay")
        .style("position", "fixed")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("background", "rgba(0,0,0,0.8)")
        .style("z-index", "1000")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center");

    // Create content container
    const content = overlay.append("div")
        .attr("class", "team-content")
        .style("background", "white")
        .style("padding", "20px")
        .style("border-radius", "8px")
        .style("max-width", "800px")
        .style("max-height", "90vh")
        .style("overflow-y", "auto");

    // Add team header
    content.append("h2")
        .text(`An Inside Look at the ${team.name}`)
        .style("margin-top", "0")
        .style("color", "#333");

    // Add team logo
    content.append("img")
        .attr("src", team.logo)
        .attr("alt", `${team.name} logo`)
        .style("height", "100px")
        .style("display", "block")
        .style("margin", "0 auto 20px");

    // Add team info
    const infoDiv = content.append("div")
        .style("display", "grid")
        .style("grid-template-columns", "1fr 1fr")
        .style("gap", "20px");

    // Left column
    const leftCol = infoDiv.append("div");
    leftCol.append("p").html(`<strong>Abbreviation:</strong> ${team.abbreviation}`);
    leftCol.append("p").html(`<strong>League:</strong> ${team.league}`);
    leftCol.append("p").html(`<strong>Division:</strong> ${team.division}`);
    leftCol.append("p").html(`<strong>Payroll Tier:</strong> ${team.payTier} of 6`);

    // Right column
    const rightCol = infoDiv.append("div");
    rightCol.append("p").html(`<strong>Average Wins:</strong> ${team.avgWins}`);
    rightCol.append("p").html(`<strong>Average Payroll:</strong> ${team.avgPayroll}`);

    // Add close button
    content.append("button")
        .text("Close")
        .style("display", "block")
        .style("margin", "20px auto 0")
        .style("padding", "8px 16px")
        .style("background", "#0066cc")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("cursor", "pointer")
        .on("click", () => overlay.remove());

    // Close when clicking outside content
    overlay.on("click", function(event) {
        if (event.target === this) {
            overlay.remove();
        }
    });
}

// Handle window resize
window.addEventListener("resize", function() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    // Update SVG dimensions
    svg.attr("width", newWidth)
        .attr("height", newHeight);

    // Update projection
    projection.scale(newWidth * 0.9)
        .translate([newWidth / 2, newHeight / 2]);

    // Update all paths
    svg.selectAll(".state").attr("d", path);

    // Update team logo positions
    svg.selectAll(".team-logo")
        .attr("x", d => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[0] - 20 : 0;
        })
        .attr("y", d => {
            const coords = projection([d.lng, d.lat]);
            return coords ? coords[1] - 20 : 0;
        });
});