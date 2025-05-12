"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/db";
import { TimeSlotModal } from "./time-slot-modal";
import { Tooltip } from "./ToolTip";

type CalendarProps = {
  events: Event[];
  userId: string;
};

export function Calendar({ events, userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [holidays, SetHolidays] = useState([]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  // this for starting week in sunday
  // const getFirstDayOfMonth = (year: number, month: number) => {
  //   return new Date(year, month, 1).getDay()
  // }

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Filter events for the current month
  const currentMonthEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === month && eventDate.getFullYear() === year;
  });

  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  currentMonthEvents.forEach((event) => {
    const dateStr = event.date;
    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr].push(event);
  });

  async function fetchHolidays() {
    const calendarId = encodeURIComponent(
      "db589a2f4025e5c1e05b3d3670dea21a3428a4a770091e596f84189dca6f94c5@group.calendar.google.com"
    );
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    ).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}`
    );

    const data = await res.json();
    return data.items; 
  }

  useEffect(() => {
    const fetch_Holiday = async () => {
      const holiday = await fetchHolidays();
      console.log(holiday);
      SetHolidays(holiday);
    };

    fetch_Holiday();
  }, []);

  type HolidayByDate = Record<string, { summary: string; color: string }>;

  const holidaysByDate: HolidayByDate = {};

  holidays.forEach((holiday: any) => {
    const dateStr = holiday.start.date;
    const summary = holiday.summary;

    let color = "";

    if (summary.includes("Poya Day")) {
      color = "bg-yellow-200";
    } else if (summary.includes("(P,B,M)")) {
      color = "bg-red-200";
    } else if (summary.includes("(P,B)")) {
      color = "bg-orange-200";
    }

    if (color) {
      holidaysByDate[dateStr] = { summary, color };
    }
  });

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(
      <div key={`empty-${i}`} className="h-12 border border-gray-200 p-1"></div>
    );
  }

  function formatDateToUTC(date: Date) {
    return date.toISOString().split("T")[0];
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = date.toISOString().split("T")[0];
    const hasEvents = eventsByDate[dateStr] && eventsByDate[dateStr].length > 0;
  
    const isToday = formatDateToUTC(new Date()) === dateStr;
  
    const holiday = holidaysByDate[dateStr];
  
    days.push(
      <Tooltip text={holiday ? holiday.summary : ""} key={day}>
        <div
          title={holiday ? holiday.summary : ""}
          className={cn(
            "h-12 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors",
            {
              "bg-blue-50": hasEvents,
              "border-red-500": isToday,
              [holiday?.color || ""]: holiday,
            }
          )}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex flex-col h-full">
            <span
              className={cn("text-sm font-medium text-center p-1", {
                "text-blue-600": hasEvents,
              })}
            >
              {day}
            </span>
            {hasEvents && (
              <div className="mt-auto">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {dayNames.map((day) => (
            <div
              key={day}
              className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">{days}</div>
      </div>

      {selectedDate && (
        <TimeSlotModal
          isOpen={isModalOpen}
          onClose={closeModal}
          date={selectedDate}
          events={
            selectedDate
              ? eventsByDate[selectedDate.toISOString().split("T")[0]] || []
              : []
          }
          userId={userId}
        />
      )}
    </>
  );
}
