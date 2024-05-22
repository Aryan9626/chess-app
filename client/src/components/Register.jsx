import React from 'react'
import { Button, Checkbox, Form, Input } from 'antd';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const onFinish = (values) => {
    console.log('Success:', values);
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };


const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const register=()=>{
      navigate("/")
  }

  const onFinish = async() => {
    let payload = {username: username, password: password}
    let response = await axios.post("http://localhost:8081/register", payload)
    console.log(response)
    if(response){
        alert("user registered successfully")
        
        navigate("/")
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
    <>
      <h1 style={{ position: "relative",bottom:"50px", left:"450px",fontSize:"70px" }}>Chess App</h1>
    <div style={{ position: "relative", top: "100px" }}>
      <Button onClick={register}>Login Here</Button>
     <h1 style={{ position: "relative", left: "130px",fontSize:"40px" }}>Register</h1>
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

export default Register