import { Form, Input, Button, DatePicker, Row, Col, Select, Typography, Checkbox, Tooltip } from 'antd';
import { PortalIcon } from '@/components/portal-icon';
import { ImageUploadBox } from './employee-create-screen';

const { Text } = Typography;

function SectionTitle({ title, tooltip }: { title: string; tooltip?: string }) {
  return (
    <div className="section-title-pink">
      <span className="pink-text">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {title}
        {tooltip && (
          <Tooltip title={tooltip}>
            <span style={{ color: '#fa8c16', cursor: 'pointer', marginLeft: 4 }}>❓</span>
          </Tooltip>
        )}
      </span>
    </div>
  );
}

export function BankList() {
  return (
    <>
      <SectionTitle title="Thông tin ngân hàng" tooltip="Cung cấp thông tin tài khoản ngân hàng để nhận lương" />
      <Form.List name="banks">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={5}>
                  <Form.Item {...restField} name={[name, 'accountNo']} label="Số tài khoản" style={{ marginBottom: 0 }}>
                    <Input placeholder="Số tài khoản" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, 'accountName']} label="Tên tài khoản" style={{ marginBottom: 0 }}>
                    <Input placeholder="Tên tài khoản" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, 'bankName']} label="Ngân hàng" style={{ marginBottom: 0 }}>
                    <Input placeholder="Ngân hàng" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, 'branch']} label="Chi nhánh" style={{ marginBottom: 0 }}>
                    <Input placeholder="Chi nhánh" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>
                Thêm tài khoản ngân hàng
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function WorkPermitList() {
  return (
    <>
      <SectionTitle title="Thông tin giấy phép lao động" />
      <Form.List name="workPermits">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'permitNo']} label="Số giấy phép lao động" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập số giấy phép" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item {...restField} name={[name, 'issueDate']} label="Ngày cấp" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày cấp" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item {...restField} name={[name, 'expiryDate']} label="Ngày hết hạn" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                  </Form.Item>
                </Col>
                <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm giấy phép lao động</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function VisaList() {
  return (
    <>
      <SectionTitle title="Thông tin Thị Thực/Tạm trú" />
      <Form.List name="visas">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'visaNo']} label="Số Thị Thực/Tạm trú" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập số Thị Thực/Tạm trú" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item {...restField} name={[name, 'issueDate']} label="Ngày cấp" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày cấp" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item {...restField} name={[name, 'expiryDate']} label="Ngày hết hạn" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                  </Form.Item>
                </Col>
                <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm Thị Thực/Tạm trú</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function FamilyList() {
  return (
    <>
      <SectionTitle title="Thông tin gia đình & người phụ thuộc" />
      <Form.List name="families">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <div key={key} style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, marginBottom: 16, position: 'relative', background: '#fafbfc' }}>
                <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }} />
                <Row gutter={16}>
                  <Col span={4}>
                    <Form.Item {...restField} name={[name, 'relationship']} label="Mối quan hệ">
                      <Select placeholder="Chọn"><Select.Option value="BO">Bố</Select.Option><Select.Option value="ME">Mẹ</Select.Option><Select.Option value="CON">Con</Select.Option><Select.Option value="VO">Vợ</Select.Option><Select.Option value="CHONG">Chồng</Select.Option></Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'fullName']} label="Họ và tên">
                      <Input placeholder="Họ và tên" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item {...restField} name={[name, 'birthday']} label="Ngày sinh">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item {...restField} name={[name, 'phone']} label="Điện thoại">
                      <Input placeholder="Điện thoại" />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item {...restField} name={[name, 'identityNo']} label="CMT/Căn cước">
                      <Input placeholder="Số CCCD" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={4}>
                    <Form.Item {...restField} name={[name, 'issueDate']} label="Ngày cấp">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày cấp" />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <Form.Item {...restField} name={[name, 'issuePlace']} label="Nơi cấp">
                      <Input placeholder="Nơi cấp" />
                    </Form.Item>
                  </Col>
                  <Col span={3} style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Item {...restField} name={[name, 'isDependent']} label="Phụ thuộc" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Checkbox />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'permanentAddress']} label="Địa chỉ thường trú">
                      <Input placeholder="Địa chỉ thường trú" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'temporaryAddress']} label="Địa chỉ tạm trú">
                      <Input placeholder="Địa chỉ tạm trú" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm người phụ thuộc</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function EducationList() {
  return (
    <>
      <SectionTitle title="Quá trình học tập" />
      <Form.List name="educations">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'fromDate']} label="Từ ngày" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Từ ngày" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'toDate']} label="Đến ngày" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Đến ngày" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'trainingType']} label="Hình thức đào tạo" style={{ marginBottom: 0 }}>
                    <Select placeholder="Chọn hình thức"><Select.Option value="CHINH_QUY">Chính quy</Select.Option><Select.Option value="TAI_CHUC">Tại chức</Select.Option></Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'major']} label="Chuyên ngành" style={{ marginBottom: 0 }}>
                    <Input placeholder="Chuyên ngành" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'academicLevel']} label="Trình độ" style={{ marginBottom: 0 }}>
                    <Select placeholder="Chọn trình độ"><Select.Option value="DAI_HOC">Đại học</Select.Option><Select.Option value="THAC_SI">Thạc sĩ</Select.Option></Select>
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item {...restField} name={[name, 'trainingPlace']} label="Nơi đào tạo" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nơi đào tạo" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm quá trình học tập</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function PartyHistoryList() {
  return (
    <>
      <SectionTitle title="Lịch sử tham gia Đảng / Đoàn" />
      <Form.List name="partyHistories">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'partyCardNo']} label="Số thẻ" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập số thẻ" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'partyForm']} label="Hình thức" style={{ marginBottom: 0 }}>
                    <Select placeholder="Chọn hình thức"><Select.Option value="DU_BI">Dự bị</Select.Option><Select.Option value="CHINH_THUC">Chính thức</Select.Option></Select>
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'fromDate']} label="Từ ngày" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Từ ngày" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'toDate']} label="Đến ngày" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Đến ngày" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'joinPlace']} label="Nơi kết nạp" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập nơi kết nạp" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item {...restField} name={[name, 'transferPlace']} label="Nơi điều chuyển" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập nơi điều chuyển" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm lịch sử đảng viên</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function ExperienceList() {
  return (
    <>
      <SectionTitle title="Kinh nghiệm làm việc" />
      <Form.List name="experiences">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'fromMonth']} label="Từ tháng" style={{ marginBottom: 0 }}>
                    <DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" placeholder="Từ tháng" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'toMonth']} label="Đến tháng" style={{ marginBottom: 0 }}>
                    <DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" placeholder="Đến tháng" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item {...restField} name={[name, 'company']} label="Công ty" style={{ marginBottom: 0 }}>
                    <Input placeholder="Công ty" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'position']} label="Vị trí" style={{ marginBottom: 0 }}>
                    <Input placeholder="Vị trí" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'referenceName']} label="Người tham chiếu" style={{ marginBottom: 0 }}>
                    <Input placeholder="Họ tên" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'referencePhone']} label="Điện thoại" style={{ marginBottom: 0 }}>
                    <Input placeholder="Số điện thoại" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm kinh nghiệm</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

export function CertificateList() {
  return (
    <>
      <SectionTitle title="Bằng cấp / Chứng chỉ" />
      <Form.List name="certificates">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={16} key={key} align="top" style={{ marginBottom: 16 }}>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'certificateNo']} label="Số hiệu chứng chỉ" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập số hiệu" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'issuedBy']} label="Đơn vị ban hành" style={{ marginBottom: 0 }}>
                    <Input placeholder="Nhập đơn vị" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'type']} label="Loại chứng chỉ" style={{ marginBottom: 0 }}>
                    <Select placeholder="Chọn loại"><Select.Option value="NGOAI_NGU">Ngoại ngữ</Select.Option><Select.Option value="TIN_HOC">Tin học</Select.Option><Select.Option value="CHUYEN_MON">Chuyên môn</Select.Option></Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'validFrom']} label="Ngày hiệu lực" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item {...restField} name={[name, 'validTo']} label="Ngày hết hiệu lực" style={{ marginBottom: 0 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item {...restField} name={[name, 'attachmentFile']} label="Tệp đính kèm" style={{ marginBottom: 0 }}>
                    <Input placeholder="Link / tên file" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
                  <Button type="text" onClick={() => remove(name)} icon={<PortalIcon name="x" />} danger />
                </Col>
              </Row>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PortalIcon name="plus" />}>Thêm chứng chỉ</Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </>
  );
}

