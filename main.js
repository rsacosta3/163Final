// Set dimensions based on container
const container = document.getElementById("map-container");
const width = container.clientWidth;
const height = container.clientHeight;

// Create SVG with fixed dimensions matching container
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Set up projection to fit the US in the fixed container
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width * 0.9); // Adjusted scale for better fit

// Create path generator
const path = d3.geoPath().projection(projection);

// MLB team data with coordinates and logos
const mlbTeams = [
    {name: "Arizona Diamondbacks", abbreviation: "ARI", lat: 33.4453, lng: -112.0667, logo: "logos/dbacks.png"},
    {name: "Atlanta Braves", abbreviation: "ATL", lat: 33.7348, lng: -84.3898, logo: "logos/braves.png"},
    {name: "Baltimore Orioles", abbreviation: "BAL", lat: 39.2839, lng: -77.9217, logo: "logos/orioles.png"},
    {name: "Boston Red Sox", abbreviation: "BOS", lat: 42.3467, lng: -70.0972, logo: "logos/bosox.png"},
    {name: "Chicago Cubs", abbreviation: "CHC", lat: 41.9484, lng: -87.6553, logo: "logos/cubs.png"},
    {name: "Chicago White Sox", abbreviation: "CHW", lat: 39.43, lng: -88.6338, logo: "logos/sox.png"},
    {name: "Cincinnati Reds", abbreviation: "CIN", lat: 39.0975, lng: -84.5066, logo: "logos/reds.png"},
    {name: "Cleveland Guardians", abbreviation: "CLE", lat: 41.4962, lng: -82.6852, logo: "logos/guardians.png"},
    {name: "Colorado Rockies", abbreviation: "COL", lat: 39.7561, lng: -104.9941, logo: "logos/rockies.png"},
    {name: "Detroit Tigers", abbreviation: "DET", lat: 43.3391, lng: -84.5486, logo: "logos/tigers.png"},
    {name: "Houston Astros", abbreviation: "HOU", lat: 29.7572, lng: -95.3556, logo: "logos/cheaters.png"},
    {name: "Kansas City Royals", abbreviation: "KC", lat: 39.0516, lng: -94.9906, logo: "logos/royals.png"},
    {name: "Los Angeles Angels", abbreviation: "LAA", lat: 34.9003, lng: -116.8827, logo: "logos/angels.png"},
    {name: "Los Angeles Dodgers", abbreviation: "LAD", lat: 34.9739, lng: -119.94, logo: "logos/dodgers.png"},
    {name: "Miami Marlins", abbreviation: "MIA", lat: 25.7781, lng: -80.2196, logo: "logos/marlins.png"},
    {name: "Milwaukee Brewers", abbreviation: "MIL", lat: 44.0281, lng: -88.9713, logo: "logos/brewers.png"},
    {name: "Minnesota Twins", abbreviation: "MIN", lat: 44.9817, lng: -94.2774, logo: "logos/twins.png"},
    {name: "New York Mets", abbreviation: "NYM", lat: 42.7571, lng: -75.2458, logo: "logos/mets.png"},
    {name: "New York Yankees", abbreviation: "NYY", lat: 41.2296, lng: -72.9262, logo: "logos/yankees.png"},
    {name: "Oakland Athletics", abbreviation: "OAK", lat: 39.7516, lng: -122.005, logo: "logos/athletics.png"},
    {name: "Philadelphia Phillies", abbreviation: "PHI", lat: 39.9059, lng: -75.1665, logo: "logos/phillies.png"},
    {name: "Pittsburgh Pirates", abbreviation: "PIT", lat: 40.4469, lng: -80.0058, logo: "logos/pirates.png"},
    {name: "San Diego Padres", abbreviation: "SD", lat: 32.7076, lng: -117.1569, logo: "logos/padres.png"},
    {name: "San Francisco Giants", abbreviation: "SF", lat: 37.2786, lng: -122.4093, logo: "logos/giants.png"},
    {name: "Seattle Mariners", abbreviation: "SEA", lat: 47.5913, lng: -122.3325, logo: "logos/mariners.png"},
    {name: "St. Louis Cardinals", abbreviation: "STL", lat: 38.6226, lng: -91.1928, logo: "logos/cards.png"},
    {name: "Tampa Bay Rays", abbreviation: "TB", lat: 27.7682, lng: -82.6534, logo: "logos/rays.png"},
    {name: "Texas Rangers", abbreviation: "TEX", lat: 32.7511, lng: -97.0824, logo: "logos/rangers.png"},
    {name: "Toronto Blue Jays", abbreviation: "TOR", lat: 47.6415, lng: -79.3891, logo: "logos/jays.png"},
    {name: "Washington Nationals", abbreviation: "WSH", lat: 36.873, lng: -77.0074, logo: "logos/nats.png"}
];


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

        // Add team logos
        svg.selectAll(".team-logo")
            .data(mlbTeams)
            .enter()
            .append("image")
            .attr("class", "team-logo")
            .attr("xlink:href", d => d.logo)
            .attr("width", 40) // Adjust logo size as needed
            .attr("height", 40)
            .attr("x", d => {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[0] - 20 : 0; // Center the logo
            })
            .attr("y", d => {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[1] - 20 : 0;
            })
            .attr("opacity", 0) // Start invisible for fade-in effect
            .transition()
            .duration(1000)
            .attr("opacity", 1);
    })
    .catch(error => {
        console.error("Error loading the map data:", error);
    });

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