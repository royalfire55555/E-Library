import React, { Component } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Text,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    ToastAndroid,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config";
import { Alert } from "react-native-web";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bookId: "",
            studentId: "",
            domState: "normal",
            hasCameraPermissions: null,
            scanned: false,
            bookName: "",
            studentName: "",
        };
    }

    getCameraPermissions = async (domState) => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);

        this.setState({
            hasCameraPermissions: status === "granted",
            domState: domState,
            scanned: false,
        });
    };

    handleBarCodeScanned = async ({ type, data }) => {
        const { domState } = this.state;

        if (domState === "bookId") {
            this.setState({
                bookId: data,
                domState: "normal",
                scanned: true,
            });
        } else if (domState === "studentId") {
            this.setState({
                studentId: data,
                domState: "normal",
                scanned: true,
            });
        }
    };

    handleTransaction = async () => {
        const { bookId, studentId } = this.state;
        await this.getBookDetails(bookId);
        await this.getStudentDetails(studentId);

        var transactionType = await this.checkBookAvailability(bookId);

        if (!transactionType) {
            this.setState({ bookId: "", studentId: "" });

            Alert.alert("The book doesn't exist in the library database!");
        } else if (transactionType === "issue") {
            var isEligible = await this.checkStudentEligibilityForBookIssue(
                studentId
            );

            if (isEligible) {
                var { bookName, studentName } = this.state;
                this.initiateBookIssue(
                    bookId,
                    studentId,
                    bookName,
                    studentName
                );
            }

            Alert.alert("Book issued to the student!");
        } else {
            var isEligible = await this.checkStudentEligibilityForBookReturn(
                bookId,
                studentId
            );

            if (isEligible) {
                var { bookName, studentName } = this.state;
                this.initiateBookReturn(
                    bookId,
                    studentId,
                    bookName,
                    studentName
                );
            }

            Alert.alert("Book returned to the library!");
        }
    };

    checkStudentEligibilityForBookIssue = async (studentId) => {
        const studentRef = await db
            .collection("students")
            .doc("studentId", "==", studentId)
            .get();

        var isStudentEligible = "";

        if (student.doc.length == 0) {
            this.setState({
                bookId: "",
                studentId: "",
            });
            isStudentEligible = false;
            Alert.alert("The student is not registered in the library!");
        } else {
            studentRef.docs.map((doc) => {
                if (doc.data().numOfBooks < 3) {
                    isStudentEligible = true;
                } else {
                    isStudentEligible = false;
                    this.setState({
                        bookId: "",
                        studentId: "",
                    });
                    Alert.alert("The student has reached the limit of books!");
                }
            });
        }

        return isStudentEligible;
    };

    checkStudentEligibilityForBookReturn = async (studentId) => {
        const studentRef = await db
            .collection("students")
            .doc("studentId", "==", studentId)
            .get();

        var isStudentEligible = "";

        transactionRef.docs.map((doc) => {
            var lastTransaction = doc.data();

            if (lastTransaction.studentId === studentId) {
                isStudentEligible = true;
            } else {
                isStudentEligible = false;
                this.setState({
                    bookId: "",
                    studentId: "",
                });
                Alert.alert("The book is not in the student's possession!");
            }
        });
        return isStudentEligible;
    };

    getBookDetails = (book_id) => {
        book_id = book_id.trim();
        db.collections("books")
            .where("bookId", "==", book_id)
            .get()
            .then((snapshot) => {
                snapshot.docs.map((doc) => {
                    this.setState({
                        bookName: doc.data().bookDetails.bookName,
                    });
                });
            });
    };

    getStudentDetails = (student_id) => {
        student_id = student_id.trim();
        db.collections("students")
            .where("studentId", "==", student_id)
            .get()
            .then((snapshot) => {
                snapshot.docs.map((doc) => {
                    this.setState({
                        studentName: doc.data().studentDetails.studentName,
                    });
                });
            });
    };

    checkBookAvailability = async (bookId) => {
        const bookRef = await db
            .collection("books")
            .where("bookId", "==", bookId)
            .get();

        var transactionType = "";
        if (bookRef.docs.length == 0) {
            transactionType = false;
        } else {
            bookRef.docs.map((doc) => {
                //if the book is available then transaction type will be issue
                // otherwise it will be return
                transactionType = doc.data().isBookAvailable
                    ? "issue"
                    : "return";
            });
        }

        return transactionType;
    };

    initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
        db.collections("transactions").add({
            studentId: studentId,
            bookId: bookId,
            bookName: bookName,
            studentName: studentName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transactionType: "issue",
        });

        db.collections("books").doc(bookId).update({
            isBookAvalable: false,
        });

        db.collections("students")
            .doc(studentId)
            .update({
                numberOfBooks: firebase.firestore.FieldValue.increment(1),
            });
        this.setState({
            bookId: "",
            studentId: "",
        });
    };

    initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
        db.collections("transactions").add({
            studentId: studentId,
            bookId: bookId,
            bookName: bookName,
            studentName: studentName,
            date: firebase.firestore.Timestamp.now().toDate(),
            transactionType: "return",
        });

        db.collections("books").doc(bookId).update({
            isBookAvalable: true,
        });

        db.collections("students")
            .doc(studentId)
            .update({
                numberOfBooks: firebase.firestore.FieldValue.increment(-1),
            });
        this.setState({
            bookId: "",
            studentId: "",
        });
    };

    render() {
        const { bookId, studentId, domState, scanned } = this.state;
        if (domState !== "normal") {
            return (
                <BarCodeScanner
                    onBarCodeScanned={
                        scanned ? undefined : this.handleBarCodeScanned
                    }
                    style={StyleSheet.absoluteFillObject}
                />
            );
        }

        return (
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage}>
                    <View style={styles.upperContainer}>
                        <Image source={appIcon} style={styles.appIcon} />
                        <Image source={appName} style={styles.appName} />
                    </View>
                    <View style={styles.lowerContainer}>
                        <View style={styles.textinputContainer}>
                            <TextInput
                                style={styles.textinput}
                                placeholder={"Book Id"}
                                placeholderTextColor={"#FFFFFF"}
                                value={bookId}
                                onChangeText={(text) => {
                                    this.setState({ bookId: text });
                                }}
                            />
                            <TouchableOpacity
                                style={styles.scanbutton}
                                onPress={() =>
                                    this.getCameraPermissions("bookId")
                                }
                            >
                                <Text style={styles.scanbuttonText}>Scan</Text>
                            </TouchableOpacity>
                        </View>
                        <View
                            style={[
                                styles.textinputContainer,
                                { marginTop: 25 },
                            ]}
                        >
                            <TextInput
                                style={styles.textinput}
                                placeholder={"Student Id"}
                                placeholderTextColor={"#FFFFFF"}
                                value={studentId}
                                onChangeText={(text) => {
                                    this.setState({ studentId: text });
                                }}
                            />
                            <TouchableOpacity
                                style={styles.scanbutton}
                                onPress={() =>
                                    this.getCameraPermissions("studentId")
                                }
                            >
                                <Text style={styles.scanbuttonText}>Scan</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={this.handleTransaction}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    bgImage: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
    },
    upperContainer: {
        flex: 0.5,
        justifyContent: "center",
        alignItems: "center",
    },
    appIcon: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        marginTop: 80,
    },
    appName: {
        width: 80,
        height: 80,
        resizeMode: "contain",
    },
    lowerContainer: {
        flex: 0.5,
        alignItems: "center",
    },
    textinputContainer: {
        borderWidth: 2,
        borderRadius: 10,
        flexDirection: "row",
        backgroundColor: "#9DFD24",
        borderColor: "#FFFFFF",
    },
    textinput: {
        width: "57%",
        height: 50,
        padding: 10,
        borderColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 3,
        fontSize: 18,
        backgroundColor: "#5653D4",
        fontFamily: "Rajdhani_600SemiBold",
        color: "#FFFFFF",
    },
    scanbutton: {
        width: 100,
        height: 50,
        backgroundColor: "#9DFD24",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    scanbuttonText: {
        fontSize: 24,
        color: "#0A0101",
        fontFamily: "Rajdhani_600SemiBold",
    },
    button: {
        marginTop: 25,
        width: "10%",
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F48D20",
        borderRadius: 15,
    },
    buttonText: {
        fontSize: 24,
        color: "#FFFFFF",
        fontFamily: "Rajdhani_600SemiBold",
    },
});
