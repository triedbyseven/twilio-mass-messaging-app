import { useState } from 'react';
import { ButtonPrimary } from '../components/button';
import { Label, LabelDescription } from '../components/label';
import { ListSimple } from '../components/list';
import { AddPhoneNumberForm, TextMessage } from '../components/section';
import { v4 as uuid } from 'uuid';
import fetch from 'isomorphic-fetch';
import Image from 'next/image';
import Head from 'next/head';

interface HomeState {
  id: string;
  phoneNumber: string;
  phoneNumberFormatted: string;
  state: string;
}

export default function Home() {
  const [phoneNumbers, setPhoneNumbers] = useState<HomeState[]>([]);
  const [textMessage, setTextMessage] = useState<string>();
  const [isSyncing, setSyncing] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitting] = useState<boolean>(false);


  const addPhoneNumber = (phoneNumber: string): void => {
    // Check if item exists
    if(phoneNumber === "") return alert('Please enter a valid phone number.');
    
    // Check if item is already in the list
    const response = phoneNumbers.find(phoneNumberItem => phoneNumberItem.phoneNumber === phoneNumber);
    if(response) return alert('This phone number has already been added to the list');

    // Convert pretty formatted number to E.136 format
    let phoneNumberFormatted = phoneNumber;
    phoneNumberFormatted = phoneNumberFormatted.replace("(", "");
    phoneNumberFormatted = phoneNumberFormatted.replace(")", "");
    phoneNumberFormatted = phoneNumberFormatted.replace("-", "");
    phoneNumberFormatted = phoneNumberFormatted.replace(" ", "");
    phoneNumberFormatted = "+1" + phoneNumberFormatted;

    const newPhoneNumber = { id: uuid(), phoneNumber, phoneNumberFormatted: phoneNumberFormatted, state: "none" };
    setPhoneNumbers(prevState => [newPhoneNumber, ...prevState]);
  };

  const deletePhoneNumber = (id: string) => {
    const newPhoneNumbers = phoneNumbers.filter(phoneNumber => phoneNumber.id !== id);
    setPhoneNumbers(newPhoneNumbers);
  };

  const sendMessagesOnSubmit = async (): Promise<void> => {
    try {
      setIsSubmitting(true);
      const response = await fetch('http://localhost:3000/api/twilio',{
        method: 'POST',
        body: JSON.stringify({ phoneNumbers: phoneNumbers, message: textMessage }),
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const json = await response.json();

      const failedPhoneNumbers = json.phoneNumbersFailed;
      let newData: any = []
      failedPhoneNumbers.forEach((phoneNumber: any, index: number): void => {
        console.log(phoneNumber);
        phoneNumber.id === phoneNumbers[index].id ? newData.push({  ...phoneNumber  }) : null
      });

      setPhoneNumbers(newData);
      setIsSubmitting(false);
    } catch (error) {
      console.error(error)
    }
  };

  return (
    <>
      <Head>
        <title>My page title</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className="p-4 sm:p-0 container mx-auto h-full flex flex-wrap justify-center content-center">
        <div className="w-full lg pb-0 shadow-md rounded-md" style={{ maxWidth: 512 }}>
          <div className="px-4 py-5 bg-violet space-y-6 sm:p-6 justify-center flex rounded-t-lg">
            <Image
              src="/logo-joymd.png"
              alt="Picture of the author"
              width={134}
              height={60}
            />
          </div>
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <ListSimple rows={phoneNumbers} deletePhoneNumber={deletePhoneNumber} />
            <div>
              <Label text="Phone Number" htmlFor="phone" />
              <LabelDescription description="A customers 10-digit cellular number. International phone numbers are not supported at this time." />
              <AddPhoneNumberForm addPhoneNumber={addPhoneNumber} isSubmitted={isSubmitted} />
              <Label text="Message" htmlFor="text_message" />
              <LabelDescription description="Write a message that every customer on your list will recieve." />
              <TextMessage name="text_message" setTextMessage={setTextMessage} isSyncing={isSyncing} setSyncing={setSyncing} />
            </div>         
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <ButtonPrimary onClick={sendMessagesOnSubmit} label="Send Text" disabled={phoneNumbers.length === 0 || isSyncing || !textMessage || isSubmitted}/>
          </div>
        </div>
      </div>
    </>
  )
};