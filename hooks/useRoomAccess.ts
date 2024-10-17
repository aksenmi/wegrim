// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useUserInfoStore } from "@/hooks/useUserInfoStore";

// export const useRoomAccess = (roomId: string | number) => {
//   const user = useUserInfoStore((state) => state.user); // 사용자 정보 가져오기
//   const router = useRouter();
//   const [hasAccess, setHasAccess] = useState(false);

//   useEffect(() => {
//     const checkRoomAccess = async () => {
//       // 사용자가 로그인하지 않았으면 로그인 페이지로 이동
//       if (!user) {
//         router.push("/login");
//         return;
//       }

//       // roomId 또는 user.email이 없는 경우 early return
//       if (!user.email || !roomId) return;

//       try {
//         // API를 통해 방 접근 권한 확인
//         const response = await fetch(
//           `/api/rooms/checkAccess?roomId=${roomId}&userEmail=${encodeURIComponent(
//             user.email
//           )}`
//         );
//         const result = await response.json();

//         if (!result.hasAccess) {
//           // 권한이 없으면 로비 페이지로 리다이렉트
//           router.push("/lobby");
//         } else {
//           // 권한이 있으면 접근 허용
//           setHasAccess(true);
//         }
//       } catch (error) {
//         console.error("방 권한 확인 중 오류:", error);
//         // 오류가 발생해도 로비로 리다이렉트
//         router.push("/lobby");
//       }
//     };

//     checkRoomAccess();
//   }, [user, roomId, router]);

//   return hasAccess;
// };
