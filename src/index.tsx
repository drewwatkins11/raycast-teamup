import { ActionPanel, List, Action, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import got from "got";

const times: TimeObject[] = [
  {
    text: "15 minutes",
    minutes: "15",
  },
  {
    text: "30 minutes",
    minutes: "30",
  },
  {
    text: "45 minutes",
    minutes: "45",
  },
  {
    text: "1 hour",
    minutes: "60",
  },
  {
    text: "90 minutes",
    minutes: "90",
  },
  {
    text: "2 hours",
    minutes: "180",
  },
];

const createAuth = (authValues: AuthValues) => {
  const apiRoot = `https://api.teamup.com/${authValues.calendar}`;
  const headers = {
    "Teamup-Token": authValues.token,
  };

  return { apiRoot, headers };
};

const getCalendar = async (auth: GotConfig) => {
  const { body } = await got(`${auth.apiRoot}/events`, {
    headers: { ...auth.headers },
  });

  console.log(body);
  return body;
};

const getSubcalendars = async (auth: GotConfig) => {
  const { body } = await got(`${auth.apiRoot}/subcalendars`, {
    headers: { ...auth.headers },
  });

  console.log(body);
  return body;
};

function TimeDropdown(props: { onTimeChange: (x: TimeObject) => void }) {
  const { onTimeChange } = props;

  return (
    <List.Dropdown
      tooltip="How long do you need a room?"
      defaultValue={"30"}
      onChange={(minutes) => {
        onTimeChange(times.filter((time) => time.minutes === minutes)[0]);
      }}
    >
      {times.map((time) => (
        <List.Dropdown.Item
          key={time.minutes}
          title={time.text}
          value={time.minutes}
        />
      ))}
    </List.Dropdown>
  );
}

export default function Command() {
  const [openRooms, setOpenRooms] = useState<any>(undefined);
  const [timeString, setTimeString] = useState<string>("30 minutes");
  const [minutesString, setMinutesString] = useState<string>("30");
  const [minutes, setMinutes] = useState<number>(30);
  const [roomText, setRoomText] = useState("");

  const startDt = new Date();
  const endDt = new Date(startDt.getTime() + minutes * 60000);

  const { calendar, token } = getPreferenceValues<AuthValues>();

  const auth = createAuth({ calendar, token });

  const loadRooms = async () => {
    let events: any;
    let rooms: any;
    const occupiedRooms: any = [];

    await getCalendar(auth).then((res) => (events = JSON.parse(res).events));
    await getSubcalendars(auth).then(
      (res) => (rooms = JSON.parse(res).subcalendars)
    );

    events = events
      .map((event: any) => {
        return {
          ...event,
          start_dt: new Date(event.start_dt),
          end_dt: new Date(event.end_dt),
        };
      })
      .filter((event: any) => event.start_dt < endDt)
      .filter((event: any) => event.end_dt > startDt);

    for (let ev in events) {
      occupiedRooms.push(events[ev].subcalendar_id);
    }

    rooms = rooms.filter((room: any) => {
      return occupiedRooms.indexOf(room.id) === -1;
    });

    console.log("got rooms", rooms);
    setOpenRooms(rooms);
  };

  useEffect(() => {
    loadRooms();
  }, [minutes]);

  useEffect(() => {
    if (openRooms !== undefined) {
      if (!openRooms.length) {
        setRoomText("No rooms available");
      } else if (openRooms.length === 1) {
        setRoomText("One room is available");
      } else {
        setRoomText(`There are ${openRooms.length} rooms available.`);
      }
    } else console.log("rooms is undefined");
  }, [openRooms]);

  useEffect(() => {
    if (!!minutesString) setMinutes(parseInt(minutesString));
  }, [minutesString]);

  return (
    <List
      navigationTitle={`Rooms open in the next ${timeString}`}
      searchBarPlaceholder="Filter rooms"
      isLoading={openRooms === undefined}
      searchBarAccessory={
        <TimeDropdown
          onTimeChange={(time: TimeObject) => {
            setMinutesString(time.minutes);
            setTimeString(time.text);
            console.log(time);
          }}
        />
      }
    >
      {openRooms?.map((room: any) => (
        <List.Item
          key={room}
          title={room.name}
          actions={
            <ActionPanel>
              <Action
                title="Select"
                onAction={() => console.log(`${room} selected`)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

interface AuthValues {
  calendar: string;
  token: string;
}

interface GotConfig {
  apiRoot: string;
  headers: GotHeaders;
}

interface GotHeaders {
  "Teamup-Token": string;
}

interface TimeObject {
  text: string;
  minutes: string;
}
