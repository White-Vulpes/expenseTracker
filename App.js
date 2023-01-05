import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView, Dimensions, FlatList, ToastAndroid } from 'react-native';
import dark from './themes/dark';
import {FontAwesome} from '@expo/vector-icons';

export default function App() {

  const [expenseHistory, addExpenseHistory] = useState([]);
  const [amount, onAmountChange] = useState('0');
  const [note, onNoteChange] = useState('No Note');
  const URL = 'https://white-vulpes.hasura.app/v1/graphql';

  var fetcher = async (query, variables) => {
    var result = await fetch(URL,{method: 'POST',headers: {'content-type':'application/json', 'x-hasura-admin-secret':'SimpleLoginPageDuhh'},body: JSON.stringify({query:query, variables:variables})}).then((response) => response.json()).then((user) => { return user;});
    return result;
  }

  useEffect(() => {
    (async () => {
      let query = `query MyQuery {
                    expense_tracker_expense_records(limit: 6, order_by: {timestamp: asc}) {
                      amount
                      id
                      note
                      timestamp
                    }
                  }`;
      let result = await fetcher(query, {});
      if(result.data.expense_tracker_expense_records.length > 0){
        addExpenseHistory(result.data.expense_tracker_expense_records);
      }
    })();
  },[expenseHistory]);

  let onAddExpense = async () => {

    let query = `mutation MyMutation($amount: String, $note: String) {
                  insert_expense_tracker_expense_records_one(object: {amount: $amount, note: $note}) {
                    id
                    timestamp
                  }
                }`;
    let variables = {
      amount: amount,
      note: note
    }

    let result = await fetcher(query, variables);
    if(result.data.insert_expense_tracker_expense_records_one.id != null){
      addExpenseHistory((prevState) => {
        let length = prevState.unshift({'note': note, 'amount': amount, 'id': result.data.insert_expense_tracker_expense_records_one.id, 'time': result.data.insert_expense_tracker_expense_records_one.timestamp});
        if(length > 6) prevState.pop();
        return [...prevState];
      })
    }
    else{
      ToastAndroid.show("Expense not updated Please Try again", ToastAndroid.SHORT);
    }
    
  }

  let deleteExpense = async (item) => {
    let query = `mutation MyMutation($id: uuid!) {
                  delete_expense_tracker_expense_records_by_pk(id: $id) {
                    id
                  }
                }`;
    let variables = {
      id: item.id
    }

    let result = await fetcher(query, variables);
    if(result.data.delete_expense_tracker_expense_records_by_pk.id != null){
      addExpenseHistory((prevState) => {
        let index = prevState.findIndex((itemForid) => {
          return itemForid.id == item.id
        });
        prevState.splice(index, 1);
        return [...prevState];
      })
    }
    else{
      ToastAndroid.show("Expense not deleted Please Try again", ToastAndroid.SHORT);
    }
  }

  let designListView = (item) => {
    return (
      <View style={styles.cardView}>
        <Text style={{left: 20, position: 'absolute', fontSize: 24, color: '#91D8E4', fontWeight: '600'}}>{item.note}</Text>
        <Text style={{fontSize: 24, position: 'absolute', right: 20, color: '#DA0037', fontWeight: '600'}}>₹{item.amount}  <TouchableOpacity onPress={() => deleteExpense(item)} style={styles.deleteButton}><FontAwesome name="minus-circle" size={24} color="#DA0037" /></TouchableOpacity></Text>
      </View>
    )
  }

  return (
      <ScrollView style={styles.scrollview} nestedScrollEnabled={true}>
        <StatusBar style="auto" animated={true} backgroundColor={dark().background}/>
        <View style={styles.amount}>
          <View style={styles.amountInput}>
            <FontAwesome name="rupee" size={40} style={{padding: 5}}/>
            <TextInput keyboardType={'numeric'} textAlign={'center'} style={styles.input} onChangeText={onAmountChange}></TextInput>
          </View>
          <TextInput style={styles.noteInput} textAlign={'center'} placeholder='Add Note' onChangeText={onNoteChange}></TextInput>
          <TouchableOpacity onPress={onAddExpense} style={styles.button}><Text style={{fontSize: 18, alignContent: 'center', fontWeight: '600'}}>Add Expense</Text></TouchableOpacity>
        </View>
        <View style={styles.history}>
          <Text style={{fontSize: 30, fontWeight: '600', margin: 40, color: '#91D8E4'}}>Expense History</Text>
          <FlatList data={expenseHistory} renderItem={({item}) => {return designListView(item)}}/>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({

  input: {
    height: 70,
    color: 'white',
    width: 160,
    borderRadius: 30,
    fontSize: 30,
    backgroundColor: dark().textInput,
  },

  noteInput:{
    margin: 10,
    height: 40,
    color: 'white',
    width: 190,
    borderRadius: 10,
    fontSize: 18,
    backgroundColor: dark().textInput,
  },

  button: {
    alignItems: 'center',
    backgroundColor: '#DA0037',
    borderRadius: 15,
    justifyContent: 'center',
    marginTop: 100,
    height: 45,
    width: 200,
  },

  history: {
    alignItems: 'center'
  },

  scrollview: {
    backgroundColor: dark().background,
  },

  amount: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height - 150,
    flex: 1,
  },

  cardView: {
    paddingBottom: 37,
    margin: 3,
    backgroundColor: dark().textInput,
    borderRadius: 20,
    width: 300,
    height: 80,
    justifyContent: 'center'
  },

  amountInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: dark().background,
  },

  deleteButton: {
    borderRadius: 50,
    backgroundColor: 'black',
    height: 25,
    width: 25,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
