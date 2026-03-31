"use client";

import axios from "axios";
import { useState } from "react";
import { z } from "zod";
import { BlurFade } from "../magicui/blur-fade";
import Image from "next/image";
import grid from "@/public/assets/bg/grid.svg";
import spinner from "@/public/assets/loader/spinner.svg";
import { customToast } from "@/lib/custom-toast";
import { motion } from "framer-motion";

const emailSchema = z.string().email({ message: "Invalid email address" });

export default function Hero() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const waitListCall = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Basic client-side validation
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        customToast.warning({
          title: "",
          description: `The email body is invalid`,
        });
        return;
      }

      const response = await axios.post<{ message: string; emailId?: string }>(
        "/api/waitlist",
        {
          userEmail: email.trim(),
        },
      );

      if (response.data) {
        customToast.info({
          title: "",
          description: `${response.data.message}`,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        customToast.error({
          title: "",
          description: error.response?.data?.message || "An error occurred",
        });
      } else {
        customToast.error({
          title: "",
          description: "An error occurred",
        });
      }
    } finally {
      setEmail("");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "Enter" && !isLoading) {
      waitListCall();
    }
  };

  return (
    <div className="">
      <div className="relative h-[300px] sm:h-[400px] flex px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 justify-center items-center ">
        <Image className="absolute opacity-20 z-0" src={grid} alt="" />
        <div className=" flex flex-col items-center md:font-bold ">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold md:mb-2"
          >
            Streamline your workflow
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center items-center gap-x-1 xl:gap-x-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold"
          >
            Amplify your impact with
            <p className="text-transparent bg-gradient-to-b from-gray-600 via-gray-400 to-white bg-clip-text ml-2">
              ExporaFlow
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-4 flex flex-col items-center font-extralight text-[#AEAEAE] text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl"
          >
            <p>Issue tracking and sprint planning.</p>
            <p>Projects, boards, and timelines that keep work moving.</p>
          </motion.div>
        </div>
      </div>
      <HomeBanner />
    </div>
  );
}

const HomeBanner = () => {
  return (
    <BlurFade
      delay={1}
      inView
      className="px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40"
    >
      <div className="relative flex justify-center border-t border-[#313032c6] rounded-2xl p-1 md:p-2 bg-[#0A0A0A]">
        <div className="relative rounded-[11px] border border-[#2d3552] mask-bottom-dark w-full h-[260px] sm:h-[340px] md:h-[410px] bg-gradient-to-b from-[#101a36] via-[#0b1227] to-[#070b17] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(75,225,166,0.15),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(124,92,255,0.16),transparent_35%)]" />

          <div className="relative z-10 h-full p-4 sm:p-5 md:p-6">
            <div className="h-8 rounded-lg border border-[#2b3556] bg-[#0a1020] flex items-center px-3 gap-2">
              <div className="h-2 w-2 rounded-full bg-[#4be1a6]" />
              <div className="h-2 w-2 rounded-full bg-[#7c5cff]" />
              <div className="h-2 w-2 rounded-full bg-[#1f6feb]" />
              <p className="ml-2 text-[10px] sm:text-xs tracking-[0.18em] text-[#8ea0d5] uppercase">
                ExporaFlow Workspace Preview
              </p>
            </div>

            <div className="grid grid-cols-12 gap-3 mt-3 h-[calc(100%-2.8rem)]">
              <div className="col-span-3 rounded-lg border border-[#243055] bg-[#0a1020]/90 p-2 space-y-2">
                <div className="h-6 rounded bg-[#121b38] border border-[#2a3760] px-2 flex items-center text-[10px] text-[#8ea0d5] tracking-wide">
                  WORKSPACE
                </div>
                <div className="h-5 rounded bg-[#111a33] px-2 flex items-center text-[10px] text-[#a9b7df]">
                  Inbox
                </div>
                <div className="h-5 rounded bg-[#111a33] px-2 flex items-center text-[10px] text-[#a9b7df]">
                  Projects
                </div>
                <div className="h-5 rounded bg-[#111a33] px-2 flex items-center text-[10px] text-[#a9b7df]">
                  Sprints
                </div>
                <div className="h-5 rounded bg-[#111a33] px-2 flex items-center text-[10px] text-[#a9b7df]">
                  Reports
                </div>
              </div>

              <div className="col-span-9 rounded-lg border border-[#243055] bg-[#0a1020]/80 p-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[#9fb0dd]">Release Sprint - Board</p>
                  <div className="h-7 px-3 rounded-md bg-[#162247] border border-[#2a3760] flex items-center text-[10px] sm:text-xs text-[#c2cff1]">
                    + New issue
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="h-16 rounded-md bg-[#101938] border border-[#26345d] p-2">
                    <p className="text-[10px] text-[#93a5d5]">Backlog</p>
                    <p className="text-xs mt-2 text-[#dce5ff]">12 issues</p>
                  </div>
                  <div className="h-16 rounded-md bg-[#101938] border border-[#26345d] p-2">
                    <p className="text-[10px] text-[#93a5d5]">In Progress</p>
                    <p className="text-xs mt-2 text-[#dce5ff]">7 issues</p>
                  </div>
                  <div className="h-16 rounded-md bg-[#101938] border border-[#26345d] p-2">
                    <p className="text-[10px] text-[#93a5d5]">Completed</p>
                    <p className="text-xs mt-2 text-[#dce5ff]">23 issues</p>
                  </div>
                </div>

                <div className="mt-3 grow rounded-md border border-[#26345d] bg-gradient-to-b from-[#0e1731] to-[#0a1122] p-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="h-16 rounded border border-[#2a3760] bg-[#0a1020] p-2">
                      <p className="text-[10px] text-[#93a5d5]">Velocity</p>
                      <p className="text-sm text-[#dce5ff] mt-1">+18%</p>
                    </div>
                    <div className="h-16 rounded border border-[#2a3760] bg-[#0a1020] p-2">
                      <p className="text-[10px] text-[#93a5d5]">Risk flags</p>
                      <p className="text-sm text-[#dce5ff] mt-1">2 open</p>
                    </div>
                  </div>
                  <div className="h-20 rounded border border-[#2a3760] bg-[#0a1020] p-2">
                    <p className="text-[10px] text-[#93a5d5] mb-2">Recent updates</p>
                    <div className="h-1.5 rounded bg-[#29416e] w-full mb-1.5" />
                    <div className="h-1.5 rounded bg-[#274066] w-4/5 mb-1.5" />
                    <div className="h-1.5 rounded bg-[#274066] w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BlurFade>
  );
};
