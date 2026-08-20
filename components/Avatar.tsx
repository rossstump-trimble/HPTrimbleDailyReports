import React, { useState } from "react";
import styles from "./Avatar.module.css";
import Image from "next/image";

interface AvatarProps {
  src: string;
  name: string;
  fallback: string;
  showNameOnHover?: boolean;
}

export function Avatar({
  src,
  name,
  fallback,
  showNameOnHover = true,
}: AvatarProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={styles.avatar}>
        <div className={styles.avatar_picture}>
          <Image
            src={src}
            alt={name}
            className={styles.avatar_picture}
            width={24}
            height={24}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.avatar} ${!showNameOnHover ? styles.noHover : ""}`}
      data-tooltip={showNameOnHover ? name : undefined}
    >
      <Image
        src={src}
        alt={name}
        className={styles.avatar_picture}
        width={24}
        height={24}
      />
    </div>
  );
}
