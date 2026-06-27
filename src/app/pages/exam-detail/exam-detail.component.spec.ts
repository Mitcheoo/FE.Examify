import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ExamDetailComponent } from './exam-detail.component';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';

describe('ExamDetailComponent', () => {
  let component: ExamDetailComponent;
  let fixture: ComponentFixture<ExamDetailComponent>;
  let createOrderSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createOrderSpy = vi.fn().mockReturnValue(of({
      orderCode: 'ABCDEFGHIJ',
      payPalOrderId: '6BT06639T81375044',
      status: 'CREATED',
      approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=6BT06639T81375044'
    }));

    await TestBed.configureTestingModule({
      imports: [ExamDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'exam-1' })
          }
        },
        {
          provide: ExamService,
          useValue: {
            getExerciseById: () => of({
              id: 'exam-1',
              title: 'Sample Exam',
              isFullTest: false,
              skill: 0,
              timeLimitSeconds: 3600
            })
          }
        },
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({ id: 'user-1' })
          }
        },
        {
          provide: PaymentService,
          useValue: {
            createOrder: createOrderSpy
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamDetailComponent);
    component = fixture.componentInstance;
  });

  it('calls createOrder during ngOnInit with the default amount', () => {
    const redirectSpy = vi.spyOn(component as any, 'redirectToApprovalUrl').mockImplementation(() => {});

    fixture.detectChanges();

    expect(createOrderSpy).toHaveBeenCalledTimes(1);

    const payload = createOrderSpy.mock.calls[0][0];
    expect(payload.totalAmount).toBe(15);
    expect(payload.currency).toBe('USD');
    expect(payload.orderCode).toMatch(/^[A-Z]{10}$/);
    expect(redirectSpy).toHaveBeenCalledWith('https://www.sandbox.paypal.com/checkoutnow?token=6BT06639T81375044');
  });
});
