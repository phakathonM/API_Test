import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function insertStation(station: any) {
    try {
        await prisma.station.upsert({
            where: { id: station.id },
            update: {}, // ถ้าเจอ id ซ้ำ จะไม่อัปเดต (เหมือน DO NOTHING)
            create: {
                id: station.id,
                station_code: station.station_code,
                name: station.name,
                en_name: station.en_name,
                th_short: station.th_short,
                en_short: station.en_short,
                chname: station.chname,
                controldivision: Number(station.controldivision) || null,
                exact_km: Number(station.exact_km) || null,
                exact_distance: Number(station.exact_distance) || null,
                km: Number(station.km) || null,
                class: Number(station.class) || null,
                lat: Number(station.lat) || null,
                long: Number(station.long) || null,
                active: station.active === 1 || station.active === true,
                giveway: station.giveway === 1 || station.giveway === true,
                dual_track: station.dual_track === 1 || station.dual_track === true,
                comment: station.comment === "NULL" ? null : station.comment,
            }
            ,
        });
        console.log(`Inserted station ${station.name}`);
    } catch (error) {
        console.error("Insert error:", error);
    }
}

async function fetchAndSave() {
    try {
        const response = await axios.get(
            "https://data.go.th/dataset/9bccd66e-8b14-414d-93d5-da044569350c/resource/70e1ac97-edfe-4751-8965-6bbe16fb21b4/download/data_station.json"
        );
        const stations = response.data;

        for (const station of stations) {
            await insertStation(station);
        }

        console.log("All stations saved.");
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fetchAndSave();
