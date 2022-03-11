import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const MapNoSSR = () => {
  const [geoData, setGeoData] = useState(null);
  const [populationData, setPopulationData] = useState(null);

  const mapPopulation = (data) => {
    const population = new Map();

    data.forEach((point) => {
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
  }, []);

  const getStyle = (feature) => {
    const populationNumber = populationData?.get(feature.properties.GEOID);
    const colors = ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

    if (populationNumber > 1000000) {
      return { color: colors[4], weight: 1, opacity: 0.6, fillOpacity: 0.6 };
    } else if (populationNumber > 100000) {
      return { color: colors[3], weight: 1, opacity: 0.6, fillOpacity: 0.6 };
    } else if (populationNumber > 10000) {
      return { color: colors[2], weight: 1, opacity: 0.6, fillOpacity: 0.6 };
    } else if (populationNumber > 1000) {
      return { color: colors[1], weight: 1, opacity: 0.6, fillOpacity: 0.6 };
    } else {
      return { color: colors[0], weight: 1, opacity: 0.6, fillOpacity: 0.6 };
    }
  };

  return (
    <MapContainer
      center={[39, -100]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!!geoData && <GeoJSON data={geoData} style={getStyle} />}
    </MapContainer>
  );
};

export default MapNoSSR;
