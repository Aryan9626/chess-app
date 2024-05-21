import React from 'react'
import { Button, Checkbox, Form, Input } from 'antd';
import { useState } from 'react';
import axios from 'axios';

const onFinish = (values) => {
    console.log('Success:', values);
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

const Login = () => {
    const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onFinish = async() => {
    let payload = {username: username, password: password}
    let response = await axios.post("http://localhost:8080/login", payload)
    console.log(response)
    if(response){
        localStorage.setItem("setName", username)
    }
    console.log("Submitting form with username:", username, "and password:", password);
  };



  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };
  return (
    <><div style={{ position: "relative", top: "300px" }}>
    <Form
      name="basic"
      labelCol={{
        span: 8,
      }}
      wrapperCol={{
        span: 16,
      }}
      style={{
        maxWidth: 600,
      }}
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[
          {
            required: true,
            message: 'Please input your username!',
          },
        ]}
      >
        <Input value={username} onChange={handleUsernameChange} />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
      >
        <Input.Password value={password} onChange={handlePasswordChange} />
      </Form.Item>

      <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form></div> 
    </>
  )
}

export default Login