"use client";
import React, { useCallback, useEffect, useState } from "react";
import "../globals.css";
import SignOut from "@/components/SignOut";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { User } from "@/types/user";
import { createSupabaseBrowserClient } from "@/lib/client/supabase";
import useHydrate from "@/hooks/useHydrate";
import AddRoom from "./_components/AddRoom";
import RoomList from "./_components/RoomList";
import { Room } from "@/types/types";

const page = () => {
  const sendUserInfoToServer = async (userData: User) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.error("Failed to send user data to the server");
      } else {
        console.log("User data sent successfully");
      }
    } catch (error) {
      console.error("Error sending user data:", error);
    }
  };
  const supabase = createSupabaseBrowserClient();
  const isMount = useHydrate();

  const user = useUserInfoStore((state) => state.user);
  const setUser = useUserInfoStore((state) => state.setUser);
  const clearUser = useUserInfoStore((state) => state.clearUser);

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getUserInfo = useCallback(async () => {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (supabaseUser) {
      const userData = {
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.full_name || "Unknown",
        avatar_url: supabaseUser.user_metadata?.avatar_url || "",
      };
      setUser(userData);

      await sendUserInfoToServer(userData);
    } else {
      clearUser();
    }
  }, [supabase, setUser, clearUser]);

  const fetchMyRooms = async () => {
    if (!user || !user.email) return;

    try {
      const myRoomResponse = await fetch(
        `/api/rooms/my?userEmail=${encodeURIComponent(user.email)}`
      );
      if (myRoomResponse.ok) {
        const data: Room[] = await myRoomResponse.json();
        setMyRooms(data);
      } else {
        console.error("Failed to fetch rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitedRooms = async () => {
    if (!user || !user.email) return;

    try {
      const invitedRoomResponse = await fetch(
        `/api/rooms/invited?userEmail=${encodeURIComponent(user.email)}`
      );
      if (invitedRoomResponse.ok) {
        const invitedRoomsData: Room[] = await invitedRoomResponse.json();
        setInvitedRooms(invitedRoomsData);
      } else {
        console.error("Failed to fetch invited rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  }; //!! 초대를 보낼때, 목록에 실시간으로 방이 뜨게끔 만들어줘야함

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (user && user.email) {
      fetchMyRooms();
      fetchInvitedRooms();
    }
  }, [user]); // user가 변경될 때마다 실행

  if (!isMount) return null;

  return (
    <div className="flex justify-center bg-slate-200 h-screen items-center ">
      <div className="flex flex-col shadow-xl rounded-xl  bg-white  h-[500px] w-[400px] items-center  overflow-y-auto ">
        <SignOut />
        <div className="flex flex-col flex-grow items-center w-4/5 ">
          <AddRoom fetchMyRooms={fetchMyRooms} />
          <RoomList
            myRooms={myRooms}
            setMyRooms={setMyRooms}
            invitedRooms={invitedRooms}
            setInvitedRooms={setInvitedRooms}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default page;
