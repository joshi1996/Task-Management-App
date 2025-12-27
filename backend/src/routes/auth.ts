import { Request, Response, Router } from "express";
import { db } from "../db/index.js";
import { NewUser, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwtToken from "jsonwebtoken";
import { auth, AuthRequest } from "../middleware/auth.js";

const authRouter = Router();

interface SignUpBodyData {
    name: string;
    email: string;
    password: string;
}

interface LoginBodyData {
    email: string;
    password: string;
}

authRouter.post('/signup', async (
    req: Request<{}, {}, SignUpBodyData>,
    res: Response) => {
    try {
        // get req body
        const { name, email, password } = req.body;
        // check if user exists
        const userExits = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        if (userExits.length) {
            res
                .status(400)
                .json({ message: 'User already exists' });
            return;
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 8); // TODO: hash password
        const newUser: NewUser = {
            name,
            email,
            password: hashedPassword,
        }
        // create a new user and store user in db
        const [user] = await db.insert(users).values(newUser).returning();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

authRouter.post(
    "/login",
    async (req: Request<{}, {}, LoginBodyData>, res: Response) => {
        try {
            // get req body
            const { email, password } = req.body;

            // check if the user doesnt exist
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (!existingUser) {
                res.status(400).json({ error: "User with this email does not exist!" });
                return;
            }

            const isMatch = await bcrypt.compare(password, existingUser.password);
            if (!isMatch) {
                res.status(400).json({ error: "Incorrect password!" });
                return;
            }

            const token = jwtToken.sign({ id: existingUser.id }, "passwordKey");

            res.json({ token, ...existingUser });
        } catch (e) {
            res.status(500).json({ error: e });
        }
    }
);

authRouter.post("/tokenIsValid", async (req, res) => {
    try {
        // get the header
        const token = req.header("x-auth-token");

        if (!token) {
            res.json(false);
            return;
        }

        // verify if the token is valid
        const verified = jwtToken.verify(token, "passwordKey");

        if (!verified) {
            res.json(false);
            return;
        }

        // get the user data if the token is valid
        const verifiedToken = verified as { id: string };

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, verifiedToken.id));

        if (!user) {
            res.json(false);
            return;
        }

        res.json(true);
    } catch (e) {
        res.status(500).json(false);
    }
});

authRouter.get("/", auth, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "User not found!" });
            return;
        }

        const [user] = await db.select().from(users).where(eq(users.id, req.user));

        res.json({ ...user, token: req.token });
    } catch (e) {
        res.status(500).json(false);
    }
});

export default authRouter;