import { useEffect, useState, useRef } from "react";
import L from "leaflet";
// import pixiOverlay from "leaflet-pixi-overlay";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import * as topojson from "topojson";

//extend Leaflet to create a GeoJSON layer from a TopoJSON file
L.TopoJSON = L.GeoJSON.extend({
  addData: function (data) {
    var geojson, key;
    if (data.type === "Topology") {
      for (key in data.objects) {
        if (data.objects.hasOwnProperty(key)) {
          geojson = topojson.feature(data, data.objects[key]);
          L.GeoJSON.prototype.addData.call(this, geojson);
        }
      }
      return this;
    }
    L.GeoJSON.prototype.addData.call(this, data);
    return this;
  },
});
L.topoJson = function (data, options) {
  return new L.TopoJSON(data, options);
};

const MapNoSSR = () => {
  const [geoData, setGeoData] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [lMap, setLMap] = useState(null);
  const [activeLevel, setActiveLevel] = useState("ADM1");
  const mapRef = useRef(null);

  const mapPopulation = (data) => {
    const population = new Map();

    data.forEach((point) => {
      population.set(point.subregion || point.region, point.population);
    });

    setPopulationData(population);
  };

  async function getData(url) {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  }

  useEffect(() => {
    getData("/geoBoundaries-USA-ADM1_simplified.topojson").then((data) =>
      setGeoData({
        ...geoData,
        ADM1: data,
      })
    );
    getData("/population.json").then((data) => mapPopulation(data));

    if (mapRef.current && !lMap) {
      const map = L.map(mapRef.current, {
        center: [39, -100],
        zoom: 5,
      }).on("zoomend", function (e) {
        const zoomLevel = e.target._zoom;

        if (zoomLevel > 7) {
          setActiveLevel("ADM2");
        } else {
          setActiveLevel("ADM1");
        }
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        id: "openstreetmap",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      setLMap(map);
    }
  }, []);

  // fetch active data
  useEffect(() => {
    if (activeLevel === "ADM2" && !geoData.ADM2) {
      getData("/geoBoundaries-USA-ADM2_simplified.topojson").then((data) =>
        setGeoData({
          ...geoData,
          ADM2: data,
        })
      );
    }
  }, [activeLevel, geoData]);

  useEffect(() => {
    if (lMap && geoData && populationData) {
      const getStyle = (feature) => {
        const populationNumber = populationData?.get(
          feature.properties.shapeName
        );
        const colors = ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

        const defaultStyle = { weight: 1, opacity: 0.6, fillOpacity: 0.6 };

        return defaultStyle;

        if (populationNumber > 1000000) {
          return { ...defaultStyle, color: colors[4] };
        } else if (populationNumber > 100000) {
          return { ...defaultStyle, color: colors[3] };
        } else if (populationNumber > 10000) {
          return { ...defaultStyle, color: colors[2] };
        } else if (populationNumber > 1000) {
          return { ...defaultStyle, color: colors[1] };
        } else {
          return { ...defaultStyle, color: colors[0] };
        }
      };

      if (geoData[activeLevel]) {
        lMap.eachLayer(function (layer) {
          if (layer.options.id !== "openstreetmap") {
            lMap.removeLayer(layer);
          }
        });

        //create an empty geojson layer
        //with a style and a popup on click
        var geojson = L.topoJson(null, {
          style: function (feature) {
            return getStyle(feature);
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup("<p>" + feature.properties.shapeName + "</p>");
          },
        }).addTo(lMap);

        geojson.addData(geoData[activeLevel]);
      }

      // L.geoJSON(geoData, { style: getStyle }).addTo(lMap);
    }
  }, [lMap, geoData, populationData, activeLevel]);

  return (
    <div ref={mapRef} id="map" style={{ height: "100%", width: "100%" }}></div>
  );
};

export default MapNoSSR;
