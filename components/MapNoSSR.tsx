import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const myStyle = {
  color: "#ff7800",
  weight: 1,
  opacity: 0.65,
};

const MapNoSSR = () => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    async function getGeoData(url: string) {
      const response = await fetch(url);
      const data = await response.json();

      setGeoData(data);
    }

    getGeoData("/counties.geojson");
  }, []);

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
      {!!geoData && <GeoJSON data={geoData} style={myStyle} />}
    </MapContainer>
  );
};

export default MapNoSSR;
