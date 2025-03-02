interface User {
    id: string;
    primaryEmailAddress: {
      emailAddress: string
    };
    fullName?: string;
  }
  
  export async function registerUser(user: User) {
    console.log(user)
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress.emailAddress,
          name: user.fullName,
        }),
      });
  
      if (!res.ok) {
        throw new Error("Failed to register user");
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  }
  