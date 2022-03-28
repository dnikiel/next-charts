import { useEffect, useState, useRef } from "react";
import L from "leaflet";
// import pixiOverlay from "leaflet-pixi-overlay";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const MapNoSSR = () => {
  const [geoData, setGeoData] = useState(null);
  const [populationData, setPopulationData] = useState<Map<any, any> | null>(
    null
  );
  const [lMap, setLMap] = useState<any | null>(null);
  const mapRef = useRef(null);

  const mapPopulation = (data: any) => {
    const population = new Map();

    data.forEach((point: any) => {
      population.set(point.us_county_fips, point.population);
    });

    setPopulationData(population);
  };

  useEffect(() => {
    async function getData(url: string) {
      const response = await fetch(url);
      const data = await response.json();

      console.log(data);
      return data;
    }

    getData("/counties.geojson").then((data) => setGeoData(data));
    getData("/population.json").then((data) => mapPopulation(data));

    if (mapRef.current && !lMap) {
      const map = L.map(mapRef.current).setView([39, -100], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      setLMap(map);
    }
  }, []);

  useEffect(() => {
    if (lMap && geoData && populationData) {
      const getStyle = (feature: any) => {
        const populationNumber = populationData?.get(feature.properties.GEOID);
        const colors = ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

        const defaultStyle = { weight: 1, opacity: 0.6, fillOpacity: 0.6 };

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

      console.log("geojson added");
      L.geoJSON(geoData, { style: getStyle }).addTo(lMap);
    }
  }, [lMap, geoData, populationData]);

  return (
    <div ref={mapRef} id="map" style={{ height: "100%", width: "100%" }}></div>
  );
};

export default MapNoSSR;
