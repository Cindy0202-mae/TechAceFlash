"use client";
import Navbar from "../../components/Navbar";
import { db } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

//page that in charge of generating flashcards
export default function Flashcard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    console.log(setIsLoading, "isLoading");

    fetch("api/generate", {
      method: "POST",
      body: text,
    })
      .then((res) => res.json())
      .then((data) => {
        setFlashcards(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching flashcards:", error);
        setIsLoading(false);
        console.log(flashcards, "flashcards");
      });
  };

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handleOpen = () => {
    if (!isSignedIn) {
      alert("Login first to save flashcards!");
      router.push({
        pathname: "/sign-up",
        query: { redirect: router.asPath }, // save the current URL as a query parameter
      });
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const saveFlashcards = async () => {
    if (!name) {
      alert("Please enter a name");
      return;
    }

    const batch = writeBatch(db);
    // const userDocRef = doc(collection(db, "users", user.id));
    const userDocRef = doc(db, "users", user.id);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const collections = docSnap.data().flashcards || [];

      if (collections.find((f) => f.name === name)) {
        alert("Flashcards collection with the same name already exists.");
        return;
      } else {
        collections.push({ name });
        batch.set(userDocRef, { flashcards: collections }, { merge: true });
      }
    } else {
      batch.set(userDocRef, { flashcards: [{ name }] });
    }

    const colRef = collection(userDocRef, name);

    flashcards.forEach((flashcard) => {
      const cardDocRef = doc(colRef);
      batch.set(cardDocRef, flashcard);
    });

    await batch.commit();
    handleClose();
    router.push("/flashcards");
  };
  return (
    <>
      <Navbar />
      <Container maxWidth="md">
        <Box
          sx={{
            mt: 4,
            mb: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h4">Generate Flashcards</Typography>
          <Paper sx={{ p: 4, width: "100%" }}>
            <TextField
              value={text}
              onChange={(e) => setText(e.target.value)}
              label="Enter text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              sx={{
                mb: 2,
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"
            >
              <div className="px-8 py-2 rounded-[6px] group transition duration-200 text-white hover:bg-transparent">
                {" "}
                See the Magic!
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="text-white text-xl pl-2"
                />
              </div>
            </Button>
          </Paper>
        </Box>

        {isLoading ? (
          <div className="sk-folding-cube">
            <div className="sk-cube1 sk-cube"></div>
            <div className="sk-cube2 sk-cube"></div>
            <div className="sk-cube4 sk-cube"></div>
            <div className="sk-cube3 sk-cube"></div>
          </div>
        ) : (
          flashcards.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5">Flashcards Preview</Typography>
              <Grid container spacing={3}>
                {flashcards.map((flashcard, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardActionArea onClick={() => handleCardClick(index)}>
                        <CardContent>
                          <Box
                            sx={{
                              perspective: "1000px",
                              "& > div": {
                                transition: "transform 0.6s",
                                transformStyle: "preserve-3d",
                                position: "relative",
                                width: "100%",
                                height: "200px",
                                boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)",
                                transform: flipped[index]
                                  ? "rotateY(180deg)"
                                  : "rotateY(0deg)",
                              },
                              "& > div > div": {
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backfaceVisibility: "hidden",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                padding: 2,
                                boxSizing: "border-box",
                              },
                              "& > div > div:nth-of-type(2)": {
                                transform: "rotateY(180deg)",
                              },
                            }}
                          >
                            <div>
                              <div>
                                <Typography variant="h5" component="div">
                                  {flashcard.front}
                                </Typography>
                              </div>
                              <div>
                                <Typography variant="h5" component="div">
                                  {flashcard.back}
                                </Typography>
                              </div>
                            </div>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ my: 4, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleOpen}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )
        )}

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Save Flashcards</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter a name for your flashcards collection
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="collection Name"
              type="text"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={saveFlashcards}>Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
