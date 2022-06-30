import React, { Component } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

import db from "../config";

export default class SearchScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            allTransactions: [],
        };
    }

    getTransactions = () => {
        db.collection("transactions")
            .get()
            .then((snapshot) => {
                snapshot.docs.map((doc) => {
                    this.setState({
                        allTransactions: [
                            ...this.state.allTransactions,
                            doc.data(),
                        ],
                    });
                });
            });
    };

    renderItem = ({ item, i }) => {
        var data = item.date
            .toDate()
            .toString()
            .split(" ")
            .splice(0, 4)
            .join("");

        var transactionType =
            item.transactionType === "issue" ? "issued" : "returned";
        return (
            <View style={{ borderWidth: 1 }}>
                <ListItem key={i} bottomDivider>
                    <Icon type={"antdesign"} name={"book"} size={40} />
                    <ListItem.Content>
                        <ListItem.Subtitle style={styles.subtitle}>
                            {`This Book ${transactionType} by ${item.studentName}`}
                        </ListItem.Subtitle>
                        <View style={styles.lowerLeftContainer}>
                            <View style={styles.transactionContainer}>
                                <Text
                                    style={[
                                        styles.transactionText,
                                        {
                                            color:
                                                item.transactionType === "issue"
                                                    ? "#78D304"
                                                    : "#0364F4",
                                        },
                                    ]}
                                >
                                    {item.transactionType
                                        .charAt(0)
                                        .toUpperCase() +
                                        item.transactionType.slice(1)}
                                </Text>
                                <Icon
                                    type={"ionIcon"}
                                    name={
                                        item.transactionType === "issue"
                                            ? "checkMark-circle-outline"
                                            : "arrow-redo-circle-outline"
                                    }
                                    color={
                                        item.transactionType === "issue"
                                            ? "#78D304"
                                            : "#0364F4"
                                    }
                                />
                            </View>
                        </View>
                    </ListItem.Content>
                </ListItem>
            </View>
        );
    };

    render() {
        return (
            <View>
                <View style={styles.container}>
                    <Text style={styles.text}>Search Screen</Text>
                </View>
                <View style={styles.lowerContainer}>
                    <FlatList
                        data={allTransactions}
                        renderItem={this.renderItem}
                        keyExtractor={(item, index) => {
                            index.toString();
                        }}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4",
    },
    text: {
        color: "#ffff",
        fontSize: 30,
    },
});
